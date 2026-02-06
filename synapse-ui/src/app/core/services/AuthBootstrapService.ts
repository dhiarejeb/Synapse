// auth-bootstrap.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {lastValueFrom} from 'rxjs';
import {refresh} from '../../services/functions';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthBootstrapService {
  constructor(private http: HttpClient, private router: Router) {}

  async init(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return;
    }

    try {
      const res = await lastValueFrom(
        refresh(this.http, environment.apiUrl, {
          body: { refreshToken }
        })
      );

      const accessToken = res?.body?.access_token;

      if (!accessToken) {
        localStorage.clear();
        this.router.navigate(['/login']);
        return;
      }

      localStorage.setItem('access_token', accessToken);

      if (res.body?.refresh_token) {
        localStorage.setItem('refresh_token', res.body.refresh_token);
      }
    } catch {
      localStorage.clear();
      this.router.navigate(['/login']);
    }
  }
}
