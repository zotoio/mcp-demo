import { ProductContext } from '../contexts/product.context';
import { Product } from '../models/product.model';
export interface ProductProtocol {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  searchProducts(query: string): Promise<Product[]>;
  updateContext(context: Partial<ProductContext>): ProductContext;
  getContext(): ProductContext;
}
