import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import {UserProfileResponse} from '../../../../services/models/user-profile-response';
import {changePassword, getProfile, updateProfile} from '../../../../services/functions';
import {ProfileUpdateRequest} from '../../../../services/models/profile-update-request';
import {ChangePasswordRequest} from '../../../../services/models/change-password-request';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';


@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule ],
  templateUrl: './user-page-component.html',
  styleUrls: ['./user-page-component.scss'],
})
export class UserPageComponent implements OnInit {

  private API_URL = 'http://localhost:8080';

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loadingProfile = false;
  updatingProfile = false;
  changingPassword = false;

  profile?: UserProfileResponse;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  // ==================== INIT FORMS ====================
  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required],
    });
  }

  // ==================== LOAD PROFILE ====================
  loadProfile(): void {
    this.loadingProfile = true;

    getProfile(this.http, this.API_URL).subscribe({
      next: (res) => {
        this.profile = res.body!;

        this.profileForm.patchValue({
          firstName: this.profile.firstName,
          lastName: this.profile.lastName,
        });
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      },
      complete: () => {
        this.loadingProfile = false;
      },
    });
  }

  // ==================== UPDATE PROFILE ====================
  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const body: ProfileUpdateRequest = {
      firstName: this.profileForm.value.firstName!,
      lastName: this.profileForm.value.lastName!,
    };

    this.updatingProfile = true;

    updateProfile(this.http, this.API_URL, { body }).subscribe({
      next: () => {
        alert('Profile updated successfully');
        this.loadProfile();
      },
      error: (err) => {
        console.error('Profile update failed', err);
      },
      complete: () => {
        this.updatingProfile = false;
      },
    });
  }

  // ==================== CHANGE PASSWORD ====================
  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmNewPassword } =
      this.passwordForm.value;

    if (newPassword !== confirmNewPassword) {
      alert('New password and confirmation do not match');
      return;
    }

    const body: ChangePasswordRequest = {
      currentPassword: currentPassword!,
      newPassword: newPassword!,
      confirmNewPassword: confirmNewPassword!,
    };

    this.changingPassword = true;

    changePassword(this.http, this.API_URL, { body }).subscribe({
      next: () => {
        alert('Password changed successfully');
        this.passwordForm.reset();
      },
      error: (err) => {
        console.error('Password change failed', err);
      },
      complete: () => {
        this.changingPassword = false;
      },
    });
  }
}
