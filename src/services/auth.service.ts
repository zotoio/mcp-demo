import { AuthContext, createDefaultAuthContext } from '../contexts/auth.context';
import { AuthProtocol } from '../protocols/auth.protocol';
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
  async login(email: string, _password: string) {
    const u = await db.findUserByEmail(email);
    if (!u) throw new Error('Not found');
    const t = Buffer.from(`${u.id}:${Date.now()}`).toString('base64');
    return this.updateContext({ currentUser: u, isAuthenticated: true, token: t });
  }
  async logout() {
    return this.updateContext(createDefaultAuthContext());
  }
  async register(email: string, name: string, _password: string) {
    if (await db.findUserByEmail(email)) throw new Error('Exists');
    const u = await db.createUser({ email, name, role: 'customer' });
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
