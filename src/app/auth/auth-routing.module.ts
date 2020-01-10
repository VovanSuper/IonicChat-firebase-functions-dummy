import { NgModule } from '@angular/core';
import {  RouterModule, Routes } from '@angular/router';

import { LoginPage } from './cmps/login/login.page';
import { SignupPage } from './cmps/signup/signup.page';

const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'signup', component: SignupPage },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
