import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { from, of, lastValueFrom } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { refresh } from '../../services/fn/authentication/refresh';
import {environment} from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (typeof window === 'undefined') {
    return false;
  }

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  // Allow navigation if we have ANY token
  if (accessToken || refreshToken) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
