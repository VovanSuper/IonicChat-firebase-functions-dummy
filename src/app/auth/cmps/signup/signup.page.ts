import { Component, OnInit } from '@angular/core';
import { DbService } from 'src/app/services/db.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ToastrService, ToastResultType } from 'src/app/services/toastr.service';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/IUser';

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
