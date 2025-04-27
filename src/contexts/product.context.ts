import { Product } from '../models/product.model';
export interface ProductContext { availableProducts: Product[]; currentProduct: Product|null; isLoading: boolean; error: Error|null; }
export const createDefaultProductContext = (): ProductContext => ({ availableProducts:[], currentProduct:null, isLoading:false, error:null });