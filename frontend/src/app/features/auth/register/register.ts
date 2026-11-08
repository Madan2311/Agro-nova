import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AuthShell } from '../auth-shell/auth-shell';

// Mismas reglas que el backend (RegisterDto)
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).+$/;

/** Valida que el campo tenga el mismo valor que otro control. */
function sameAs(other: AbstractControl<string>): ValidatorFn {
  return (control) => (control.value === other.value ? null : { mismatch: true });
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AuthShell,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);

  private readonly passwordControl = this.fb.control('', [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(64),
    Validators.pattern(PASSWORD_PATTERN),
  ]);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: this.passwordControl,
    confirm: this.fb.control('', [Validators.required, sameAs(this.passwordControl)]),
  });

  private readonly password = toSignal(this.passwordControl.valueChanges, { initialValue: '' });

  protected readonly rules = computed(() => {
    const value = this.password();
    return [
      { label: 'Mínimo 8 caracteres', ok: value.length >= 8 },
      { label: 'Una letra mayúscula', ok: /[A-Z]/.test(value) },
      { label: 'Un número', ok: /\d/.test(value) },
    ];
  });

  constructor() {
    this.passwordControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirm.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    this.loading.set(true);

    this.auth
      .register({ name: name.trim(), email: email.trim(), password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.notify.success(`¡Cuenta creada! Bienvenido, ${res.user.name}.`);
          this.router.navigate(['/products']);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 409) this.form.controls.email.setErrors({ taken: true });
        },
      });
  }
}