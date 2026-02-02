import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { from, of, lastValueFrom } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { refresh } from '../../services/fn/authentication/refresh';

export const authGuard: CanActivateFn = (): Promise<boolean> => {
  const router = inject(Router);
  const http = inject(HttpClient);

  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (token) {
    // Access token exists → allow
    return Promise.resolve(true);
  } else if (refreshToken) {
    // Try refreshing
    const refresh$ = from(refresh(http, 'http://localhost:8080', { body: { refreshToken } })).pipe(
      switchMap(res => {
        const newToken = res?.body?.access_token;
        if (newToken) {
          // Save new tokens
          localStorage.setItem('access_token', newToken);
          if (res.body?.refresh_token) {
            localStorage.setItem('refresh_token', res.body.refresh_token);
          }
          return of(true); // always return boolean
        } else {
          // Refresh failed
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          router.navigate(['/login']);
          return of(false);
        }
      }),
      catchError(() => {
        // Error while refreshing
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.navigate(['/login']);
        return of(false);
      })
    );

    // Convert Observable<boolean> → Promise<boolean>
    return lastValueFrom(refresh$);
  } else {
    // No token at all → redirect to login
    router.navigate(['/login']);
    return Promise.resolve(false);
  }
};
