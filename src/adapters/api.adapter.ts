import type { Order } from '../models/order.model';
import logger from '../utils/logger';

export class ApiAdapter {
  async processPayment(orderId: string, amount: number) {
    try {
      logger.info({ orderId, amount }, 'Processing payment');
      await new Promise((r) => setTimeout(r, 1000));
      const success = Math.random() < 0.95;
      if (!success) {
        logger.error({ orderId }, 'Payment processing failed');
      }
      return success;
    } catch (error) {
      logger.error({ orderId, error }, 'Payment processing error');
      return false;
    }
  }
  async notifyShipping(order: Order) {
    logger.info({ orderId: order.id }, 'Shipping order');
    await new Promise((r) => setTimeout(r, 500));
    return true;
  }
}
export const api = new ApiAdapter();
