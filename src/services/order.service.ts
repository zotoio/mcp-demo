import { OrderContext, createDefaultOrderContext } from '../contexts/order.context';
import { OrderProtocol } from '../protocols/order.protocol';
import { db } from '../adapters/db.adapter';
import { api } from '../adapters/api.adapter';
export class OrderService implements OrderProtocol {
  private ctx = createDefaultOrderContext();
  updateContext(u: Partial<OrderContext>) {
    this.ctx = { ...this.ctx, ...u };
    return this.ctx;
  }
  getContext() {
    return this.ctx;
  }
  async createOrder(uid: string, items: any[]) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const o = await db.createOrder({ userId: uid, items, total, status: 'pending' });
      if (!(await api.processPayment(o.id, total))) {
        await db.updateOrderStatus(o.id, 'cancelled');
        throw new Error('pay fail');
      }
      const uo = await db.updateOrderStatus(o.id, 'processing');
      if (!uo) throw new Error('upd fail');
      for (const i of items) {
        const p = await db.getProduct(i.productId);
        if (p) await db.updateProductStock(p.id, p.stock - i.quantity);
      }
      this.updateContext({ currentOrder: uo, isProcessing: false });
      return uo;
    } catch (e) {
      this.updateContext({ isProcessing: false, error: e instanceof Error ? e : new Error('err') });
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
      this.updateContext({ isProcessing: false, error: e instanceof Error ? e : new Error('err') });
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
      this.updateContext({ isProcessing: false, error: e instanceof Error ? e : new Error('err') });
      throw e;
    }
  }
  async updateOrderStatus(id: string, status: string) {
    this.updateContext({ isProcessing: true, error: null });
    try {
      const uo = await db.updateOrderStatus(id, status as any);
      if (!uo) throw new Error('nf');
      if (status === 'shipped') await api.notifyShipping(uo);
      this.updateContext({ currentOrder: uo, isProcessing: false });
      return uo;
    } catch (e) {
      this.updateContext({ isProcessing: false, error: e instanceof Error ? e : new Error('err') });
      throw e;
    }
  }
}
