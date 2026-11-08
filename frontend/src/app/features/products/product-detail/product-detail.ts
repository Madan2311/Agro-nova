import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { ConfirmData, ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { Product } from '../product.models';
import {
  categoryColor,
  formatCop,
  formatDateTime,
  stockLabel,
  stockLevel,
} from '../product-format';
import { ProductFormData, ProductFormDialog } from '../product-form-dialog/product-form-dialog';
import { ProductsApi } from '../products.api';
import { ProductsStore } from '../products.store';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProductsApi);
  private readonly store = inject(ProductsStore);
  private readonly dialog = inject(MatDialog);
  protected readonly isAdmin = inject(AuthStore).isAdmin;

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly imageFailed = signal(false);

  protected readonly color = categoryColor;
  protected readonly cop = formatCop;
  protected readonly level = stockLevel;
  protected readonly stockText = stockLabel;
  protected readonly date = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.failed.set(true);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.failed.set(false);
    this.api
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.imageFailed.set(false);
        },
        error: () => this.failed.set(true), // el interceptor ya muestra el aviso
      });
  }

  protected edit(): void {
    const product = this.product();
    if (!product) return;

    this.dialog
      .open<ProductFormDialog, ProductFormData, boolean>(ProductFormDialog, {
        data: { product },
        width: '640px',
        maxWidth: '94vw',
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.load();
      });
  }

  protected remove(): void {
    const product = this.product();
    if (!product) return;

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
        if (confirmed) this.store.remove(product.id, () => this.router.navigate(['/products']));
      });
  }
}