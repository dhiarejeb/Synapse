import { HttpInterceptorFn, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { refresh } from '../../services/fn/authentication/refresh';
import { inject } from '@angular/core';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  // Do not intercept refresh requests
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          localStorage.clear();
          router.navigate(['/login']);
          return throwError(() => err);
        }

        return from(
          refresh(http, environment.apiUrl, { body: { refreshToken } })
        ).pipe(
          switchMap(res => {
            const newToken = res?.body?.access_token;

            if (!newToken) {
              localStorage.clear();
              router.navigate(['/login']);
              return throwError(() => err);
            }

            localStorage.setItem('access_token', newToken);
            if (res.body?.refresh_token) {
              localStorage.setItem('refresh_token', res.body.refresh_token);
            }

            return next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              })
            );
          })
        );
      }

      return throwError(() => err);
    })
  );
};

