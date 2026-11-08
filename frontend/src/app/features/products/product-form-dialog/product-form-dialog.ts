import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { Product, ProductPayload } from '../product.models';
import { CATEGORIES, formatCop } from '../product-format';
import { PRODUCT_LIMITS } from '../product-limits';
import { ProductsStore } from '../products.store';

export interface ProductFormData {
  product?: Product;
}

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length === 0 ? { blank: true } : null;
}

function optionalUrl(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : { url: true };
  } catch {
    return { url: true };
  }
}

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form-dialog.html',
  styleUrl: './product-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(ProductsStore);
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialog>);

  protected readonly product = inject<ProductFormData>(MAT_DIALOG_DATA).product;
  protected readonly saving = signal(false);

  protected readonly limits = PRODUCT_LIMITS;
  protected readonly priceMax = formatCop(PRODUCT_LIMITS.price);
  protected readonly stockMax = new Intl.NumberFormat('es-CO').format(PRODUCT_LIMITS.stock);

  protected readonly categories =
    this.product?.category && !CATEGORIES.includes(this.product.category)
      ? [...CATEGORIES, this.product.category]
      : CATEGORIES;

  protected readonly form = this.fb.group({
    name: [
      this.product?.name ?? '',
      [Validators.required, notBlank, Validators.maxLength(PRODUCT_LIMITS.name)],
    ],
    sku: [
      this.product?.sku ?? '',
      [Validators.required, notBlank, Validators.maxLength(PRODUCT_LIMITS.sku)],
    ],
    category: [this.product?.category ?? '', [Validators.required]],
    price: this.fb.control<number | null>(this.product?.price ?? null, [
      Validators.required,
      Validators.min(0),
      Validators.max(PRODUCT_LIMITS.price),
    ]),
    stock: this.fb.control<number | null>(this.product?.stock ?? null, [
      Validators.required,
      Validators.min(0),
      Validators.max(PRODUCT_LIMITS.stock),
      Validators.pattern(/^\d+$/),
    ]),
    description: [
      this.product?.description ?? '',
      [Validators.maxLength(PRODUCT_LIMITS.description)],
    ],
    imageUrl: [
      this.product?.imageUrl ?? '',
      [Validators.maxLength(PRODUCT_LIMITS.imageUrl), optionalUrl],
    ],
    active: [this.product?.active ?? true],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: ProductPayload = {
      name: v.name.trim(),
      sku: v.sku.trim(),
      category: v.category,
      price: v.price as number,
      stock: v.stock as number,
      description: v.description.trim(),
      imageUrl: v.imageUrl.trim() || undefined,
      active: v.active,
    };

    this.saving.set(true);
    this.store
      .save(payload, this.product?.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: HttpErrorResponse) => {
          if (err.status === 409) this.form.controls.sku.setErrors({ taken: true });
        },
      });
  }
}