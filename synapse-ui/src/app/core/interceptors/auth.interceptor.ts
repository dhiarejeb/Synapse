import { HttpInterceptorFn, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { refresh } from '../../services/fn/authentication/refresh'; // adjust path
import { inject } from '@angular/core';
import {environment} from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient); // inject HttpClient for refresh calls
  const token = (typeof window !== 'undefined') ? localStorage.getItem('access_token') : null;


  // Attach token if available
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError(err => {
      // If 401 Unauthorized and we have a refresh token
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Call refresh endpoint
          return from(
            refresh(http, environment.apiUrl, { body: { refreshToken } }).toPromise()
          ).pipe(
            switchMap(res => {
              // ✅ Check if res and res.body exist
              if (res && res.body && res.body.access_token) {
                const newToken = res.body.access_token;

                // Save new tokens
                localStorage.setItem('access_token', newToken);
                if (res.body.refresh_token) {
                  localStorage.setItem('refresh_token', res.body.refresh_token);
                }

                // Retry original request with new token
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next(retryReq);
              }

              // Refresh failed → clear tokens
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              return throwError(() => err);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};
