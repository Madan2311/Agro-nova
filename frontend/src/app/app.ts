import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/auth/auth.service';
import { AuthStore } from './core/auth/auth.store';
import { Brand } from './shared/brand/brand';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule, MatIconModule, MatTooltipModule, Brand],
  template: `
    @if (store.isAuthenticated()) {
      <header class="bar">
        <app-brand />

        <div class="user">
          <span class="user__avatar" aria-hidden="true">{{ initial() }}</span>
          <span class="user__meta">
            <strong>{{ store.user()?.name }}</strong>
            <small>{{ roleLabel() }}</small>
          </span>
          <button
            matIconButton
            (click)="auth.logout()"
            aria-label="Cerrar sesión"
            matTooltip="Cerrar sesión"
          >
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </header>
    }
    <router-outlet />
  `,
  styles: `
    .bar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem clamp(1rem, 4vw, 2.5rem);
      background: color-mix(in srgb, var(--ag-paper) 92%, transparent);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--ag-line);
      color: var(--ag-forest);
    }
    .user {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      color: var(--ag-ink);
    }
    .user__avatar {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ag-marigold);
      font-weight: 700;
    }
    .user__meta {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .user__meta small {
      color: var(--ag-muted);
    }
    @media (max-width: 520px) {
      .user__meta {
        display: none;
      }
    }
  `,
})
export class App {
  protected readonly store = inject(AuthStore);
  protected readonly auth = inject(AuthService);

  protected readonly initial = computed(
    () => this.store.user()?.name?.charAt(0).toUpperCase() ?? '',
  );
  protected readonly roleLabel = computed(() =>
    this.store.user()?.role === 'admin' ? 'Administrador' : 'Usuario',
  );
}