import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { IsAuthGuard } from './services/isauth.guard';
import { AnonymousGuard } from 'src/app/services/anonymous.guard';

const routes: Routes = [
  // { path: 'auth', canActivate: [AnonymousGuard], loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'chats', canActivate: [IsAuthGuard], loadChildren: () => import('./chats/chats.module').then(m => m.ChatsPageModule) },
  { path: '', redirectTo: '/chats', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
