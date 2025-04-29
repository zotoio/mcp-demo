import { v4 as uuidv4 } from 'uuid';
import type { User } from '../models/user.model';
import type { Product } from '../models/product.model';
import type { Order } from '../models/order.model';

export class DatabaseAdapter {
  private users = new Map<string, User>();
  private products = new Map<string, Product>();
  private orders = new Map<string, Order>();
  findUserByEmail(email: string) {
    for (const u of this.users.values()) if (u.email === email) return u;
    return null;
  }
  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const u = { id: uuidv4(), ...data, createdAt: now, updatedAt: now };
    this.users.set(u.id, u);
    return u;
  }
  getUser(id: string) {
    return this.users.get(id) || null;
  }
  listProducts() {
    return Array.from(this.products.values());
  }
  getProduct(id: string) {
    return this.products.get(id) || null;
  }
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const p = { id: uuidv4(), ...data, createdAt: now, updatedAt: now };
    this.products.set(p.id, p);
    return p;
  }
  updateProductStock(id: string, stock: number) {
    const p = this.products.get(id);
    if (!p) return null;
    const up = { ...p, stock, updatedAt: new Date() };
    this.products.set(id, up);
    return up;
  }
  createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const o = { id: uuidv4(), ...data, createdAt: now, updatedAt: now };
    this.orders.set(o.id, o);
    return o;
  }
  getOrder(id: string) {
    return this.orders.get(id) || null;
  }
  getUserOrders(userId: string) {
    return Array.from(this.orders.values()).filter((o) => o.userId === userId);
  }
  updateOrderStatus(id: string, status: Order['status']) {
    const o = this.orders.get(id);
    if (!o) return null;
    const up = { ...o, status, updatedAt: new Date() };
    this.orders.set(id, up);
    return up;
  }
  async seed() {
    this.createUser({ email: 'admin@example.com', name: 'Admin User', role: 'admin' });
    this.createUser({
      email: 'customer@example.com',
      name: 'Test Customer',
      role: 'customer',
    });
    this.createProduct({
      name: 'Product 1',
      description: 'This is the first product',
      price: 19.99,
      stock: 100,
    });
    this.createProduct({
      name: 'Product 2',
      description: 'This is the second product',
      price: 29.99,
      stock: 50,
    });
    this.createProduct({
      name: 'Product 3',
      description: 'This is the third product',
      price: 39.99,
      stock: 25,
    });
  }
}
export const db = new DatabaseAdapter();
