import { z } from 'zod';
export const ProductSchema = z.object({ id: z.string().uuid(), name: z.string().min(1), description: z.string(), price: z.number().positive(), stock: z.number().int().min(0), createdAt: z.date(), updatedAt: z.date() });
export type Product = z.infer<typeof ProductSchema>;