import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES),
  },
  // dashboard route
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard').then(m => m.DashboardPage),
  },

  // single board route
  {
    path: 'board/:id',
    loadComponent: () =>
      import('./features/board/pages/board/board').then(m => m.BoardPage),
  },

  // fallback (redirect any unknown route to login)
  { path: '**', redirectTo: 'login' },
];

