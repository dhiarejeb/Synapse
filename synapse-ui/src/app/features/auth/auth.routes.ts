import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.LoginPage),
  },

  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup')
        .then(m => m.SignupPage),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
  ,
  {
    path: 'activate',
    loadComponent: () =>
      import('./pages/activate/activate')
        .then(m => m.ActivatePage),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
