import { ProductContext, createDefaultProductContext } from '../contexts/product.context';
import { ProductProtocol } from '../protocols/product.protocol';
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
  async listProducts() {
    this.updateContext({ isLoading: true, error: null });
    try {
      const p = await db.listProducts();
      this.updateContext({ availableProducts: p, isLoading: false });
      return p;
    } catch (e) {
      this.updateContext({ isLoading: false, error: e instanceof Error ? e : new Error(`Failed to list products: ${String(e)}`) });
      throw e;
    }
  }
  async getProduct(id: string) {
    this.updateContext({ isLoading: true, error: null });
    try {
      const p = await db.getProduct(id);
      this.updateContext({ currentProduct: p, isLoading: false });
      return p;
    } catch (e) {
      this.updateContext({ isLoading: false, error: e instanceof Error ? e : new Error(`Failed to get product: ${String(e)}`) });
      throw e;
    }
  }
  async searchProducts(q: string) {
    this.updateContext({ isLoading: true, error: null });
    try {
      const a = await db.listProducts();
      const r = a.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
      this.updateContext({ availableProducts: r, isLoading: false });
      return r;
    } catch (e) {
      this.updateContext({ isLoading: false, error: e instanceof Error ? e : new Error(`Failed to search products: ${String(e)}`) });
      throw e;
    }
  }
}
