import { User } from '../models/user.model';
export interface AuthContext { currentUser: User|null; isAuthenticated: boolean; token: string|null; }
export const createDefaultAuthContext = (): AuthContext => ({ currentUser:null, isAuthenticated:false, token:null });