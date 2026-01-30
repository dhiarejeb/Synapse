

import { HttpInterceptorFn, HttpRequest, HttpHandler } from '@angular/common/http';


export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    console.warn('AuthInterceptorFn - no token found for request:', req.url);
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('AuthInterceptorFn - token attached for:', req.url);
  return next(cloned);
};

