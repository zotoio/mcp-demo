import { Order } from '../models/order.model';
export interface OrderContext {
  currentOrder: Order | null;
  orderHistory: Order[];
  isProcessing: boolean;
  error: Error | null;
}
export const createDefaultOrderContext = (): OrderContext => ({
  currentOrder: null,
  orderHistory: [],
  isProcessing: false,
  error: null,
});
