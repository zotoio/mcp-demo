import type { AuthContext } from '../contexts/auth.context';
import type { User } from '../models/user.model';
export interface AuthProtocol {
  login(email: string, password: string): Promise<AuthContext>;
  logout(): Promise<AuthContext>;
  register(email: string, name: string, password: string): Promise<AuthContext>;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
  updateContext(context: Partial<AuthContext>): AuthContext;
  getContext(): AuthContext;
}
