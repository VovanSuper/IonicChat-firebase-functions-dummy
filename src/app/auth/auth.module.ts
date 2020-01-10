import { NgModule } from '@angular/core';

import { LoginPage } from './cmps/login/login.page';
import { SignupPage } from './cmps/signup/signup.page';
import { AuthRoutingModule } from './auth-routing.module';
import { CommonsModulesModule } from '@commons/commons.module';

@NgModule({
  imports: [
    CommonsModulesModule,
    AuthRoutingModule
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
