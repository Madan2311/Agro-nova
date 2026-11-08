import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { NotificationService } from '../notifications/notification.service';

function friendlyMessage(err: HttpErrorResponse): string {
  switch (true) {
    case err.status === 0:
      return 'No hay conexión con el servidor. Inténtalo de nuevo.';
    case err.status === 400:
      return 'Revisa los datos ingresados e inténtalo de nuevo.';
    case err.status === 401:
      return 'Correo o contraseña incorrectos.';
    case err.status === 403:
      return 'No tienes permisos para realizar esta acción.';
    case err.status === 404:
      return 'El recurso solicitado no existe.';
    case err.status === 409:
      return 'Ya existe un registro con esos datos.';
    case err.status === 429:
      return 'Demasiados intentos. Espera un momento.';
    case err.status >= 500:
      return 'Ocurrió un error en el servidor. Inténtalo más tarde.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const store = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLogin = req.url.includes('/auth/login');

      if (err.status === 401 && !isLogin) {
        store.clear();
        router.navigate(['/login']);
        notify.error('Tu sesión expiró. Inicia sesión nuevamente.');
      } else {
        notify.error(friendlyMessage(err));
      }
      return throwError(() => err);
    }),
  );
};