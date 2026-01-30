import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {catchError, of, map, mergeMap, from} from 'rxjs';
import {AuthenticationRequest} from '../../../../services/models/authentication-request';
import {login} from '../../../../services/fn/authentication/login';
import {AuthenticationResponse} from '../../../../services/models/authentication-response';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;
  private rootUrl = 'http://localhost:8080'; // your backend URL

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.error = null;

    const payload = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    login(this.http, this.rootUrl, { body: payload })
      .pipe(
        map(res => {
          console.log('Full response:', res); // Debug
          return res.body;
        }),
        catchError(err => {
          this.error = err?.error?.message || 'Login failed';
          this.loading = false;
          return of(null);
        })
      )
      .subscribe(res => {
        this.loading = false;

        if (res?.access_token) {
          // 1. Store tokens FIRST
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', res.access_token);
            localStorage.setItem('refresh_token', res.refresh_token ?? '');
          }

          console.log('Token saved:', res.access_token);

          // 2. Navigate after token is stored
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Invalid credentials';
        }
      });

  }




}
