import { z } from 'zod';
export const OrderItemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().positive(), price: z.number().positive() });
export const OrderSchema = z.object({ id: z.string().uuid(), userId: z.string().uuid(), items: z.array(OrderItemSchema), total: z.number().positive(), status: z.enum(['pending','processing','shipped','delivered','cancelled']), createdAt: z.date(), updatedAt: z.date() });
export type OrderItem = z.infer<typeof OrderItemSchema>; export type Order = z.infer<typeof OrderSchema>;