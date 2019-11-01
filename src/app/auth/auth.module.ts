import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LoginPage } from './cmps/login/login.page';
import { SignupPage } from './cmps/signup/signup.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: 'login', component: LoginPage },
      { path: 'signup', component: SignupPage },
      { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
    ])
  ],
  declarations: [
    LoginPage,
    SignupPage
  ],
  exports: [
    LoginPage,
    SignupPage
  ]
})
export class AuthModule { }
