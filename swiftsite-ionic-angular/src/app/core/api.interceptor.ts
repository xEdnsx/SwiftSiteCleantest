import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionService } from './session.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  // Nunca enviar el token a servicios ajenos a Laravel.
  if (!request.url.startsWith(environment.apiUrl + '/')) return next(request);
  const session = inject(SessionService);
  const router = inject(Router);
  const token = session.token;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return next(request.clone({ setHeaders: headers })).pipe(
    timeout(15000),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        session.clear();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};

export function httpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexion.';
    if (error.status === 429) return 'Demasiados intentos. Espera un minuto.';
    if (error.error?.errors) return Object.values(error.error.errors).flat().join(' ');
    return error.error?.message || 'No se pudo completar la solicitud.';
  }
  if (error instanceof Error && error.name === 'TimeoutError') return 'El servidor tardo demasiado en responder.';
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado.';
}
