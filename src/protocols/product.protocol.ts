import type { ProductContext } from '../contexts/product.context';
import type { Product } from '../models/product.model';
export interface ProductProtocol {
  listProducts(): Product[];
  getProduct(id: string): Product | null;
  searchProducts(query: string): Product[];
  updateContext(context: Partial<ProductContext>): ProductContext;
  getContext(): ProductContext;
}
