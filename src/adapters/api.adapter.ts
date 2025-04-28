import { Order } from '../models/order.model';

export class ApiAdapter {
  async processPayment(orderId: string, amount: number) {
    console.log(`Processing payment for ${orderId} $${amount}`);
    await new Promise((r) => setTimeout(r, 1000));
    return Math.random() < 0.95;
  }
  async notifyShipping(order: Order) {
    console.log(`Shipping ${order.id}`);
    await new Promise((r) => setTimeout(r, 500));
    return true;
  }
}
export const api = new ApiAdapter();
