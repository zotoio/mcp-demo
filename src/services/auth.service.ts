import type { AuthContext } from '../contexts/auth.context';
import { createDefaultAuthContext } from '../contexts/auth.context';
import type { AuthProtocol } from '../protocols/auth.protocol';
import { db } from '../adapters/db.adapter';
export class AuthService implements AuthProtocol {
  private context = createDefaultAuthContext();
  updateContext(u: Partial<AuthContext>) {
    this.context = { ...this.context, ...u };
    return this.context;
  }
  getContext() {
    return this.context;
  }
  login(email: string, _password: string): AuthContext {
    const u = db.findUserByEmail(email);
    if (!u) throw new Error(`User with email ${email} not found`);
    const t = Buffer.from(`${u.id}:${Date.now()}`).toString('base64');
    return this.updateContext({ currentUser: u, isAuthenticated: true, token: t });
  }
  logout() {
    return this.updateContext(createDefaultAuthContext());
  }
  register(email: string, name: string, _password: string): AuthContext {
    if (db.findUserByEmail(email)) throw new Error(`User with email ${email} already exists`);
    const u = db.createUser({ email, name, role: 'customer' });
    const t = Buffer.from(`${u.id}:${Date.now()}`).toString('base64');
    return this.updateContext({ currentUser: u, isAuthenticated: true, token: t });
  }
  getCurrentUser() {
    return this.context.currentUser;
  }
  isAuthenticated() {
    return this.context.isAuthenticated;
  }
}
