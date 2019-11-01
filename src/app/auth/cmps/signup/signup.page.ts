import { Component, OnInit } from '@angular/core';
import { DbService } from 'src/app/services/db.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ToastrService, ToastResultType } from 'src/app/services/toastr.service';
import { AuthService } from 'src/app/services/auth.service';

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
    })
  }

  signup(email: string, pass: string, username: string) {
    this.authSvc.signUpNewUser(email, pass, username).subscribe(userCreds => {
      if (!userCreds || typeof userCreds === 'undefined') {
        throw new Error('No UserCredintials in Database...');
      }
      const { uid, email } = userCreds.user;
      console.log(`User id ${uid} -- ( ${email} ) --  has been Created !...`);
      // this.userSvc.setCurrentId(uid);
      return this.router.navigateByUrl(`/chats`);
    },
      async err => {
        this.signupForm.reset({
          'username': this.signupForm.get('username').value,
          'email': this.signupForm.get('email').value,
          'pass': ''
        });
        this.toastr.getToast({
          header: 'Failed to SignUP',
          message: err.message || err,
          duration: 3000,
          operationResult: ToastResultType.FAIL
        })
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
