import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, catchError, pipe, switchMap, tap } from 'rxjs';
import { NotificationService } from '../../core/notifications/notification.service';
import { DEFAULT_FILTERS, Product, ProductFilters, ProductPayload } from './product.models';
import { ProductsApi } from './products.api';

interface ProductsState {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  filters: ProductFilters;
}

const initialState: ProductsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  filters: DEFAULT_FILTERS,
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ total, limit, filters }) => ({
    totalPages: computed(() => Math.max(1, Math.ceil(total() / limit()))),
    hasFilters: computed(() => {
      const f = filters();
      return !!(f.search.trim() || f.category || f.active || f.stock);
    }),
    isDirty: computed(() => {
      const f = filters();
      return (
        !!(f.search.trim() || f.category || f.active || f.stock) ||
        f.sort !== DEFAULT_FILTERS.sort
      );
    }),
  })),
  withMethods((store, api = inject(ProductsApi), notify = inject(NotificationService)) => {
    const fetchPage = rxMethod<{ page: number; limit: number; filters: ProductFilters }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(({ page, limit, filters }) =>
          api.list(page, limit, filters).pipe(
            tap((res) =>
              patchState(store, {
                items: res.data,
                total: res.meta.total,
                page: res.meta.page,
                limit: res.meta.limit,
                loading: false,
              }),
            ),
            catchError(() => {
              patchState(store, { loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    const reload = () =>
      fetchPage({ page: store.page(), limit: store.limit(), filters: store.filters() });

    return {
      load(page = store.page(), limit = store.limit()): void {
        fetchPage({ page, limit, filters: store.filters() });
      },

      setFilters(filters: Partial<ProductFilters>): void {
        patchState(store, (state) => ({ filters: { ...state.filters, ...filters }, page: 1 }));
        fetchPage({ page: 1, limit: store.limit(), filters: store.filters() });
      },

      save(payload: ProductPayload, id?: string): Observable<Product> {
        const request$ = id ? api.update(id, payload) : api.create(payload);
        return request$.pipe(
          tap(() => {
            notify.success(id ? 'Producto actualizado.' : 'Producto creado.');
            reload();
          }),
        );
      },

      setActive(id: string, active: boolean): void {
        api
          .update(id, { active })
          .pipe(catchError(() => EMPTY))
          .subscribe(() => {
            notify.success(active ? 'Producto activado.' : 'Producto desactivado.');
            reload();
          });
      },

      remove(id: string, onDone?: () => void): void {
        api
          .remove(id)
          .pipe(catchError(() => EMPTY))
          .subscribe(() => {
            notify.success('Producto eliminado.');
            const emptiedPage = store.items().length === 1 && store.page() > 1;
            fetchPage({
              page: emptiedPage ? store.page() - 1 : store.page(),
              limit: store.limit(),
              filters: store.filters(),
            });
            onDone?.();
          });
      },
    };
  }),
);