export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  active: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  active?: boolean;
}

export interface PaginatedProducts {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type ActiveFilter = '' | 'true' | 'false';
export type StockFilter = '' | 'out' | 'low' | 'ok';
export type SortOption = 'newest' | 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc';

export interface ProductFilters {
  search: string;
  category: string;
  active: ActiveFilter;
  stock: StockFilter;
  sort: SortOption;
}

export const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: '',
  active: '',
  stock: '',
  sort: 'newest',
};