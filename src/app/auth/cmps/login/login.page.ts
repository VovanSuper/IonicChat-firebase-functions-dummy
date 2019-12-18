import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { DbService } from 'src/app/services/db.service';
import { ToastrService, ToastResultType } from 'src/app/services/toastr.service';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/IUser';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  passwordInputType = 'password';

  constructor(private dbSvc: DbService, private router: Router, private toastr: ToastrService, private fb: FormBuilder, private authSvc: AuthService) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      'email': ['', [Validators.required, Validators.minLength(4), Validators.email]],
      'pass': ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  login(email: string, pass: string) {
    this.authSvc.logIn({ email, pass }).subscribe(
      (user: Partial<IUser>) => {
        if (user && typeof user !== 'undefined') {
          let { id, ...rest } = user;
          this.loginForm.reset({});
          this.router.navigateByUrl(`/chats`);
        } else {
          throw new Error('No User found for this Email');
        }
      }, err => {
        this.loginForm.reset({
          'email': email
        });
        this.toastr.getToast({
          header: 'Failed to SignUp',
          message: err.message || err,
          duration: 3000,
          operationResult: ToastResultType.FAIL
        });
      });
  }

  togglePassword() {
    this.passwordInputType = (this.passwordInputType === 'password') ? 'text' : 'password';
  }

}
