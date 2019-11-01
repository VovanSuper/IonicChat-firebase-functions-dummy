import { Injectable } from '@angular/core';
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { DbService } from 'src/app/services/db.service';
import { UserService } from 'src/app/services/user.service';
import { Observable, from, throwError, of } from 'rxjs';
import { IUser } from 'src/app/models/IUser';
import { concatMap, catchError, map, shareReplay } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class PushService {


  constructor(private push: FirebaseX, private db: DbService, private userSvc: UserService, private fb: AngularFireDatabase) {
    this.getNewToken().pipe(
      concatMap(freshFcmTok => {
        return this.userSvc.getCurrentUserInfo().pipe(
          concatMap((currUser: IUser) => {
            if (currUser && currUser.id) {
              return this.setTokenForUserId(currUser.id, freshFcmTok);
            } else {
              return of(null);
            }
          }),
          catchError(err => {
            console.warn(`PushSvc->ctor() :::::: ${JSON.stringify(err)}`);
            return throwError(err);
          })
        )
      })
    ).subscribe(
      val => console.log(`Handled FCM Token registration ... ${JSON.stringify(val)}`),
      err => console.log(`Error registering FCM Token :::::::::::   ${JSON.stringify(err)}`)
    )
  }


  setTokenForUserId(id: string, newFcmToken: string) {
    if (!id) {
      throw new Error('User with valid ID should be provided  ..!');
    }
    let fcmTokensUrl = `users/${id}/pushTokens`;

    // let userPushTokRef = this.db.get(`users/${user.id}/pushTokens`)
    // return from(this.fb.list(`users/${id}/pushTokens`).query.ref.transaction((tokens: string[] | string | null) => {
    return (this.db.list(fcmTokensUrl) as Observable<string[] | string | null>).pipe(
      concatMap((tokens: string[] | string | null) => {
        let tokensArr = this.combineTokens(tokens, newFcmToken);
        // return tokensArr;
        if (!tokensArr) return of(void 0);
        return (this.db.set(fcmTokensUrl, tokensArr));
      }),
      map(val => {
        console.log(`Push Token registration for current user on Device    :::::     ${JSON.stringify(val)}`);
        return val;
      }),
      catchError(err => {
        console.warn(JSON.stringify(err));
        return throwError(err);
      })
    );
  }

  onMessage() {
    return this.push.onMessageReceived().pipe(
      map(msg => {
        console.log(JSON.stringify(msg));
        return msg;
      })
    );
  }

  setChannel() {
    this.push.createChannel({
      badge: false,
      id: 'DEALROOM_DEAFAULT_CHANNEL',
      vibration: true
    }).then(channel => {
      try {
        this.push.setDefaultChannel(channel);
      } catch {
        console.error('Failed to reset Default channel..');
      }
    });
  }

  public getNewToken() {
    return from(this.push.getToken()).pipe(
      shareReplay({ bufferSize: 1, refCount: true, windowTime: 100 })
    );
  }


  private combineTokens(tokens: string[] | string | undefined, token: string) {
    if (!token) return null;

    let tokensArr = [];
    if (tokens && typeof tokens !== 'undefined') {
      if (tokens instanceof Array) {
        if (tokens.includes(token)) {
          console.log(`PushSvc->combineTokens:::::: Already have token ${token} in ${tokens}`)
          return null;
        }
        tokensArr = [...tokens, token];
      } else {
        if (tokens == token) {
          console.log(`PushSvc->combineTokens:::::: Already have token ${token} in ${tokens}`)
          return null;
        }
        tokensArr = [tokens, token];
      }
    } else {
      tokensArr = [token];
    }
    return tokensArr;
  }

}
