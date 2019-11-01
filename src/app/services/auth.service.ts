import { Injectable } from '@angular/core';
import { from, throwError, of } from 'rxjs';
import { catchError, concatMap, tap, map, mapTo, mergeMap } from 'rxjs/operators';
import { AngularFireAuth } from "@angular/fire/auth";

import { DbService } from './db.service';
import { UserService } from './user.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router, private fDb: DbService, private fAuth: AngularFireAuth, private userSvc: UserService, private storeSvc: StorageService) { }

  logInUser(email: string, pass: string) {
    return from(this.fAuth.auth.signInWithEmailAndPassword(email, pass)).pipe(
      concatMap((fbUserCreds: firebase.auth.UserCredential) => {
        let { uid, email, ...rest } = fbUserCreds.user;
        return this.setDbUserLoggedinStatus(uid, true).pipe(
          mapTo((fbUserCreds))
        )
      }),
      tap((user) => console.log(`User LogedIn :: ${JSON.stringify(user.user.email)}`)),
      tap((user) => this.userSvc.setCurrentId(user.user.uid)),
      catchError((err: firebase.auth.AuthError) => {
        console.error(`[FbSvc->logInUser()]::::::::   ${JSON.stringify(err.message)}`);
        return throwError(err);
      })
    );
  }

  signUpNewUser(email: string, pass: string, username?: string) {
    return from(this.fAuth.auth.createUserWithEmailAndPassword(email, pass)).pipe(
      concatMap(fbUserCreds => {
        let { uid, email, ...rest } = fbUserCreds.user;
        return this.userSvc.upsertDbUser({ id: uid, name: username, email }).pipe(
          concatMap(_user => {
            return this.setDbUserLoggedinStatus(uid, true).pipe(
              mapTo(fbUserCreds)
            )
          })
        );
      }),
      tap((user) => this.userSvc.setCurrentId(user.user.uid)),
      catchError((err: firebase.auth.AuthError) => {
        console.error(`[FbSvc->signInUser()]::::::::   ${JSON.stringify(err.message)}`);
        return throwError(err);
      })
    )
  }

  logOut() {
    let currUserId = this.storeSvc.get('user');
    if (!currUserId)
      throw new Error('Logout -- no User in Store ..! ');

    return from(this.fAuth.auth.signOut()).pipe(
      mergeMap(_ => {
        this.userSvc.unsetCurrUserId();
        return this.setDbUserLoggedinStatus(currUserId, false).pipe(
          mapTo(this.router.navigateByUrl('/auth/login'))
        )
      })
    );
  }

  private setDbUserLoggedinStatus(uid: string, status = true) {
    return this.fDb.set(`users/${uid}/isLoggedIn`, status);
  }


}
