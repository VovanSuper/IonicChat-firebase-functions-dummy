import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '@services/auth.service';
import { IUser } from '@models/index';
import { ToastrService, ToastResultType } from '@services/toastr.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  signupForm: FormGroup;
  passwordInputType = 'password';

  constructor(private authSvc: AuthService, private router: Router, private toastr: ToastrService, private fb: FormBuilder) { }

  ngOnInit() {
    this.signupForm = this.fb.group({
      'username': ['', [Validators.required, Validators.minLength(1)]],
      'email': ['', [Validators.required, Validators.email]],
      'pass': ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  signup(email: string, pass: string, username: string) {
    this.authSvc.signUp({ email, pass, username }).subscribe(
      (user: Partial<IUser>) => {
        if (!user || typeof user === 'undefined') {
          throw new Error('No UserCredintials in Database...');
        }
        const { id, email } = user;
        console.log(`User id ${id} -- ( ${email} ) --  has been Created !...`);
        // this.userSvc.setCurrentId(uid);
        this.signupForm.reset({});
        return this.router.navigateByUrl(`/chats`);
      },
      err => {
        this.signupForm.reset({
          'username': this.signupForm.get('username').value,
          'email': this.signupForm.get('email').value,
          'pass': ''
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
