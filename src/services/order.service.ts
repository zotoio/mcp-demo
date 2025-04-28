import { OrderContext, createDefaultOrderContext } from '../contexts/order.context';
import { OrderProtocol } from '../protocols/order.protocol';
import { Order, OrderItem } from '../models/order.model';
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
      const o = await db.createOrder({ userId: uid, items, total, status: 'pending' });
      if (!(await api.processPayment(o.id, total))) {
        await db.updateOrderStatus(o.id, 'cancelled');
        throw new Error(`Payment failed for order ${o.id}`);
      }
      const uo = await db.updateOrderStatus(o.id, 'processing');
      if (!uo) throw new Error(`Failed to update order ${o.id} to processing status`);
      for (const i of items) {
        const p = await db.getProduct(i.productId);
        if (p) await db.updateProductStock(p.id, p.stock - i.quantity);
      }
      this.updateContext({ currentOrder: uo, isProcessing: false });
      return uo;
    } catch (e) {
      this.updateContext({ 
        isProcessing: false, 
        error: e instanceof Error ? e : new Error(`Failed to create order: ${String(e)}`) 
      });
      throw e;
    }
  }
  async getOrder(id: string) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const o = await db.getOrder(id);
      this.updateContext({ currentOrder: o, isProcessing: false });
      return o;
    } catch (e) {
      this.updateContext({ 
        isProcessing: false, 
        error: e instanceof Error ? e : new Error(`Failed to get order: ${String(e)}`) 
      });
      throw e;
    }
  }
  async getUserOrders(uid: string) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const os = await db.getUserOrders(uid);
      this.updateContext({ orderHistory: os, isProcessing: false });
      return os;
    } catch (e) {
      this.updateContext({ 
        isProcessing: false, 
        error: e instanceof Error ? e : new Error(`Failed to get user orders: ${String(e)}`) 
      });
      throw e;
    }
  }
  async updateOrderStatus(id: string, status: Order['status']) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const uo = await db.updateOrderStatus(id, status);
      if (!uo) throw new Error(`Order with ID ${id} not found`);
      if (status === 'shipped') await api.notifyShipping(uo);
      this.updateContext({ currentOrder: uo, isProcessing: false });
      return uo;
    } catch (e) {
      this.updateContext({ 
        isProcessing: false, 
        error: e instanceof Error ? e : new Error(`Failed to update order status: ${String(e)}`) 
      });
      throw e;
    }
  }
}
