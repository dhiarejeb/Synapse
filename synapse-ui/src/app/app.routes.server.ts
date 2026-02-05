import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'signup',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'activate',
    renderMode: RenderMode.Prerender,
  },

  // Everything else (dashboard, board/:id, user)
  {
    path: '**',
    renderMode: RenderMode.Server,
  }
];
