import type { ProductContext } from '../contexts/product.context';
import { createDefaultProductContext } from '../contexts/product.context';
import type { ProductProtocol } from '../protocols/product.protocol';
import type { Product } from '../models/product.model';
import { db } from '../adapters/db.adapter';
export class ProductService implements ProductProtocol {
  private context = createDefaultProductContext();
  updateContext(u: Partial<ProductContext>) {
    this.context = { ...this.context, ...u };
    return this.context;
  }
  getContext() {
    return this.context;
  }
  listProducts(): Product[] {
    this.updateContext({ isLoading: true, error: null });
    try {
      const p = db.listProducts();
      this.updateContext({ availableProducts: p, isLoading: false });
      return p;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to list products: ${String(error)}`);
      this.updateContext({ isLoading: false, error: err });
      throw err;
    }
  }
  getProduct(id: string): Product | null {
    this.updateContext({ isLoading: true, error: null });
    try {
      const p = db.getProduct(id);
      this.updateContext({ currentProduct: p, isLoading: false });
      return p;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to get product: ${String(error)}`);
      this.updateContext({ isLoading: false, error: err });
      throw err;
    }
  }
  searchProducts(q: string): Product[] {
    this.updateContext({ isLoading: true, error: null });
    try {
      const a = db.listProducts();
      const r = a.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
      this.updateContext({ availableProducts: r, isLoading: false });
      return r;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to search products: ${String(error)}`);
      this.updateContext({ isLoading: false, error: err });
      throw err;
    }
  }
}
