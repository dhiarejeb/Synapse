import { Routes } from '@angular/router';
import {UserPageComponent} from './features/User/pages/user-page-component/user-page-component';
import {authGuard} from './core/guards/auth.guard';

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
    canActivate: [authGuard],
  },

  // single board route
  {
    path: 'board/:id',
    loadComponent: () =>
      import('./features/board/pages/board/board').then(m => m.BoardPage),
    canActivate: [authGuard],
  },
  {
    path: 'user',
    component: UserPageComponent,
    canActivate: [authGuard],
  },

  // fallback (redirect any unknown route to login)
  { path: '**', redirectTo: 'login' },
];

