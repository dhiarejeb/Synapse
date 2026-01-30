import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import {RegistrationRequest} from '../../../../services/models/registration-request';
import {register} from '../../../../services/fn/authentication/register';


@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  signupForm!: FormGroup;
  loading = false;
  error: string | null = null;

  private rootUrl = 'http://localhost:8080'; // your backend base URL

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.signupForm = this.fb.nonNullable.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: AbstractControl) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  submit() {
    if (this.signupForm.invalid) return;

    this.loading = true;
    this.error = null;

    const payload: RegistrationRequest = {
      firstName: this.signupForm.value.firstName,
      lastName: this.signupForm.value.lastName,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      confirmPassword: this.signupForm.value.confirmPassword
    };

    register(this.http, this.rootUrl, { body: payload }).pipe(
      catchError(err => {
        this.error = err?.error?.message || 'Registration failed';
        this.loading = false;
        return of();
      })
    ).subscribe(() => {
      this.loading = false;
      // Navigate to activate page, pass email optionally
      this.router.navigate(['/activate'], { queryParams: { email: payload.email } });
    });
  }
}
