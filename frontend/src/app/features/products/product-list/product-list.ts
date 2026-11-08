import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ConfirmData, ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { DEFAULT_FILTERS, Product, ProductFilters, SortOption } from '../product.models';
import {
  CATEGORIES,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  STOCK_OPTIONS,
  categoryColor,
  formatCop,
  stockLevel,
} from '../product-format';
import { ProductFormData, ProductFormDialog } from '../product-form-dialog/product-form-dialog';
import { ProductsStore } from '../products.store';

@Component({
  selector: 'app-product-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeFilters()' },
})
export class ProductList implements OnInit {
  protected readonly store = inject(ProductsStore);
  protected readonly isAdmin = inject(AuthStore).isAdmin;
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  protected readonly columns = ['product', 'category', 'price', 'stock', 'status', 'actions'];

  protected readonly color = categoryColor;
  protected readonly cop = formatCop;
  protected readonly level = stockLevel;

  protected readonly categories = CATEGORIES;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly stockOptions = STOCK_OPTIONS;
  protected readonly sortOptions = SORT_OPTIONS;

  protected readonly filtersOpen = signal(false);

  protected readonly activeCount = computed(() => {
    const f = this.store.filters();
    return [f.category, f.active, f.stock].filter(Boolean).length;
  });

  protected readonly search = new FormControl(this.store.filters().search, { nonNullable: true });

  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((value) => {
        if (value !== this.store.filters().search) this.store.setFilters({ search: value });
      });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected setFilter(patch: Partial<ProductFilters>): void {
    this.store.setFilters(patch);
  }

  protected onSort(event: Event): void {
    this.store.setFilters({ sort: (event.target as HTMLSelectElement).value as SortOption });
  }

  protected clearFilters(): void {
    this.search.setValue('', { emitEvent: false });
    this.store.setFilters({ ...DEFAULT_FILTERS });
  }

  protected openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  protected onPage(event: PageEvent): void {
    this.store.load(event.pageIndex + 1, event.pageSize);
  }

  protected openDetail(event: MouseEvent, product: Product): void {
    if ((event.target as HTMLElement).closest('a, button')) return;
    this.router.navigate(['/products', product.id]);
  }

  protected openForm(product?: Product): void {
    this.dialog.open<ProductFormDialog, ProductFormData>(ProductFormDialog, {
      data: { product },
      width: '640px',
      maxWidth: '94vw',
      autoFocus: 'first-tabbable',
    });
  }

  protected confirmDelete(product: Product): void {
    this.dialog
      .open<ConfirmDialog, ConfirmData, boolean>(ConfirmDialog, {
        data: {
          title: '¿Eliminar este producto?',
          message: `Se eliminará «${product.name}» del catálogo. Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
        },
        width: '420px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.store.remove(product.id);
      });
  }

  protected toggleActive(product: Product): void {
    this.store.setActive(product.id, product.active === false);
  }
}