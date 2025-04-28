import { Order } from '../models/order.model';
import logger from '../utils/logger';

export class ApiAdapter {
  async processPayment(orderId: string, amount: number) {
    logger.info({ orderId, amount }, 'Processing payment');
    await new Promise((r) => setTimeout(r, 1000));
    return Math.random() < 0.95;
  }
  async notifyShipping(order: Order) {
    logger.info({ orderId: order.id }, 'Shipping order');
    await new Promise((r) => setTimeout(r, 500));
    return true;
  }
}
export const api = new ApiAdapter();
