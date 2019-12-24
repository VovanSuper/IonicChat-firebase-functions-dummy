import { Injectable } from '@angular/core';
import { from, throwError, of } from 'rxjs';
import { catchError, concatMap, tap, map, mapTo, mergeMap, take, mergeAll } from 'rxjs/operators';
import { AngularFireAuth } from "@angular/fire/auth";

import { DbService } from './db.service';
import { UserService } from './user.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { IUser } from 'src/app/models/IUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router, private fDb: DbService, private fAuth: AngularFireAuth, private userSvc: UserService, private storeSvc: StorageService) { }

  logIn({ email, pass }: { email: string; pass: string; } = { email: '', pass: '' }) {
    if (!email.length || !pass.length) return throwError(`Email / Password should not be empty..!  `);

    return from(this.fAuth.auth.signInWithEmailAndPassword(email, pass)).pipe(
      concatMap((fbUserCreds: firebase.auth.UserCredential) => {
        const { uid, email, ...rest } = fbUserCreds.user;
        return this.setDbUserLoggedinStatus({ uid, status: true }).pipe(
          mapTo({ id: uid, email } as Partial<IUser>)
        );
      }),
      // tap((user) => console.log(`User LogedIn :: ${JSON.stringify(user.email)}`)),
      tap((user) => this.userSvc.setCurrentId(user.id)),
      catchError((err: firebase.auth.AuthError) => {
        console.error(`[FbSvc->logInUser()]::::::::   ${JSON.stringify(err.message)}`);
        return throwError(err);
      })
    );
  }

  signUp({ email, pass, username }: { email: string; pass: string; username?: string; } = { email: '', pass: '', username: '' }) {
    if (!email.length || !pass.length || !username.length) return throwError(`Email / Password / Username should not be empty..!  `);

    return from(this.fAuth.auth.createUserWithEmailAndPassword(email, pass)).pipe(
      concatMap(fbUserCreds => {
        let { uid, email, ...rest } = fbUserCreds.user;
        return this.userSvc.upsertDbUser({ id: uid, name: username, email }).pipe(
          concatMap(_user => {
            return this.setDbUserLoggedinStatus({ uid, status: true }).pipe(
              mapTo({ id: uid, email } as Partial<IUser>)
            );
          })
        );
      }),
      tap((user) => this.userSvc.setCurrentId(user.id)),
      catchError((err: firebase.auth.AuthError) => {
        console.error(`[FbSvc->signInUser()]::::::::   ${JSON.stringify(err.message)}`);
        return throwError(err);
      })
    );
  }

  logOut() {
    let currUserId = this.storeSvc.get('user');
    if (!currUserId)
      throw new Error('Logout -- no User in Store ..! ');

    return from(this.fAuth.auth.signOut()).pipe(
      mergeMap(_ => {
        this.userSvc.unsetCurrUserId();
        return this.setDbUserLoggedinStatus({ uid: currUserId, status: false }).pipe(
          mapTo(this.router.navigateByUrl('/auth/login')),
        );
      }),
      mergeAll()
    );
  }

  private setDbUserLoggedinStatus({ uid, status = true }: { uid: string; status?: boolean; }) {
    return this.fDb.set(`users/${uid}/isLoggedIn`, status).pipe(take(1));
  }


}
