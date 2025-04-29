import type { OrderContext} from '../contexts/order.context';
import { createDefaultOrderContext } from '../contexts/order.context';
import type { OrderProtocol } from '../protocols/order.protocol';
import type { Order, OrderItem } from '../models/order.model';
import { db } from '../adapters/db.adapter';
import { api } from '../adapters/api.adapter';
export class OrderService implements OrderProtocol {
  private context = createDefaultOrderContext();
  updateContext(u: Partial<OrderContext>) {
    this.context = { ...this.context, ...u };
    return this.context;
  }
  getContext() {
    return this.context;
  }
  async createOrder(uid: string, items: OrderItem[]) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const o = db.createOrder({ userId: uid, items, total, status: 'pending' });
      if (!(await api.processPayment(o.id, total))) {
        db.updateOrderStatus(o.id, 'cancelled');
        throw new Error(`Payment failed for order ${o.id}`);
      }
      const uo = db.updateOrderStatus(o.id, 'processing');
      if (!uo) throw new Error(`Failed to update order ${o.id} to processing status`);
      for (const i of items) {
        const p = db.getProduct(i.productId);
        if (p) db.updateProductStock(p.id, p.stock - i.quantity);
      }
      this.updateContext({ currentOrder: uo, isProcessing: false });
      return uo;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to create order: ${String(error)}`);
      this.updateContext({
        isProcessing: false,
        error: err,
      });
      throw err;
    }
  }
  getOrder(id: string): Order | null {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const o = db.getOrder(id);
      this.updateContext({ currentOrder: o, isProcessing: false });
      return o;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to get order: ${String(error)}`);
      this.updateContext({
        isProcessing: false,
        error: err,
      });
      throw err;
    }
  }
  getUserOrders(uid: string): Order[] {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const os = db.getUserOrders(uid);
      this.updateContext({ orderHistory: os, isProcessing: false });
      return os;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to get user orders: ${String(error)}`);
      this.updateContext({
        isProcessing: false,
        error: err,
      });
      throw err;
    }
  }
  async updateOrderStatus(id: string, status: Order['status']) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const uo = db.updateOrderStatus(id, status);
      if (!uo) throw new Error(`Order with ID ${id} not found`);
      if (status === 'shipped') await api.notifyShipping(uo);
      this.updateContext({ currentOrder: uo, isProcessing: false });
      return uo;
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(`Failed to update order status: ${String(error)}`);
      this.updateContext({
        isProcessing: false,
        error: err,
      });
      throw err;
    }
  }
}
