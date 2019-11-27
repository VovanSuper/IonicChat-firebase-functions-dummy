import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { DbService } from 'src/app/services/db.service';
import { UserService } from 'src/app/services/user.service';
import { ToastrService, ToastResultType } from 'src/app/services/toastr.service';
import { AuthService } from 'src/app/services/auth.service';

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
      'email': ['', [Validators.required, Validators.minLength(1), Validators.email]],
      'pass': ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  login(email: string, pass: string) {
    this.authSvc.logInUser({ email, pass }).subscribe(val => {
      if (val && typeof val !== 'undefined') {
        let cUId = val.user.uid;
        this.router.navigateByUrl(`/chats`);
      } else {
        throw new Error('No User found for this Email');
      }
    }, async err => {
      this.loginForm.reset({});
      this.toastr.getToast({
        header: 'Failed to SignUP',
        message: err.message || err,
        duration: 3000,
        operationResult: ToastResultType.FAIL
      });
    });
  }

  togglePassword() {
    if (this.passwordInputType == 'password') {
      this.passwordInputType = 'text';
    }
    else {
      this.passwordInputType = 'password';
    }
  }

}
