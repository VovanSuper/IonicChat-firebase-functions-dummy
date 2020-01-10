import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AnonymousGuard } from '@services/anonymous.guard';
import { IsAuthGuard } from '@services/isauth.guard';

const routes: Routes = [
  { path: 'auth', canActivate: [AnonymousGuard], loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  // { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'chats',  canActivate: [IsAuthGuard], loadChildren: () => import('./chats/chats.module').then(m => m.ChatsPageModule) },
  { path: '', redirectTo: '/chats', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, onSameUrlNavigation: 'reload', urlUpdateStrategy: 'eager' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
