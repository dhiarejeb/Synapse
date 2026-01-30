import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { catchError, of } from 'rxjs';
import {ActivationRequest} from '../../../../services/models/activation-request';
import {activateAccount} from '../../../../services/fn/authentication/activate-account';

@Component({
  selector: 'app-activate-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './activate.page.html',
  styleUrls: ['./activate.page.scss'],
})
export class ActivatePage implements OnInit {
  activateForm!: FormGroup;
  loading = false;
  error: string | null = null;
  private rootUrl = 'http://localhost:8080';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.activateForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    // Prefill email from query params if available
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.activateForm.patchValue({ email });
    }
  }

  submit() {
    if (this.activateForm.invalid) return;

    this.loading = true;
    this.error = null;

    const payload: ActivationRequest = {
      email: this.activateForm.value.email,
      code: this.activateForm.value.code
    };

    activateAccount(this.http, this.rootUrl, { body: payload }).pipe(
      catchError(err => {
        this.error = err?.error?.message || 'Activation failed';
        this.loading = false;
        return of();
      })
    ).subscribe(() => {
      this.loading = false;
      this.router.navigate(['/login']);
    });
  }
}
