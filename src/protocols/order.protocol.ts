import type { OrderContext } from '../contexts/order.context';
import type { Order, OrderItem } from '../models/order.model';
export interface OrderProtocol {
  createOrder(userId: string, items: OrderItem[]): Promise<Order>;
  getOrder(id: string): Order | null;
  getUserOrders(userId: string): Order[];
  updateOrderStatus(id: string, status: Order['status']): Promise<Order>;
  updateContext(context: Partial<OrderContext>): OrderContext;
  getContext(): OrderContext;
}
