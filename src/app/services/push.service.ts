import { Injectable } from '@angular/core';
import { FirebaseX } from "@ionic-native/firebase-x/ngx";
import { DbService } from 'src/app/services/db.service';
import { UserService } from 'src/app/services/user.service';
import { Observable, from, throwError, of } from 'rxjs';
import { IUser } from 'src/app/models/IUser';
import { concatMap, catchError, map, shareReplay, take, tap } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn } from '@angular/fire/database';

export interface IPushMsg {
  title?: string;
  body?: string;
  data?: { [key: string]: string; };
}

@Injectable({
  providedIn: 'root'
})
export class PushService {

  constructor(private push: FirebaseX, private db: DbService, private userSvc: UserService, private fb: AngularFireDatabase) {
    this.getNewToken().pipe(
      concatMap(token => {
        return this.userSvc.CurrentUserID.pipe(
          concatMap(({ id }: Partial<IUser>) => {
            if (id) {
              return this.setTokenForUserId({ uID: id, token });
            } else {
              return of(null);
            }
          })
        );
      }),
      catchError(err => {
        console.warn(`PushSvc->ctor() : ${JSON.stringify(err)}`);
        return throwError(err);
      })
    ).subscribe(
      val => console.log(`[PushService] : Handled FCM Token registration ... ${JSON.stringify(val)}`),
      err => console.log(`[PushService] : Error registering FCM Token :::::::::::   ${JSON.stringify(err)}`)
    );
  }


  public setTokenForUserId({ uID, token }: { uID: string; token: string; } = { uID: null, token: null }) {
    if (!uID) {
      throw new Error('User with valid ID should be provided  ..!');
    }
    let fcmTokensUrl = `users/${uID}/pushTokens`;

    // let userPushTokRef = this.db.get(`users/${user.id}/pushTokens`)
    // return from(this.fb.list(`users/${id}/pushTokens`).query.ref.transaction((tokens: string[] | string | null) => {
    return (this.db.list(fcmTokensUrl) as Observable<string[] | string | null>).pipe(
      take(1),
      concatMap((tokens: string[] | string | null) => {
        let tokensArr = token && this.combineTokens(tokens, token);
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

  public onMessage(): Observable<IPushMsg> {
    return this.push.onMessageReceived().pipe(
      map(msg => {
        console.log(JSON.stringify(msg));
        return msg as IPushMsg;
      })
    );
  }

  public async setChannel() {
    const channel = await this.push.createChannel({
      badge: false,
      id: 'PUSHTESTER_DEAFAULT_CHANNEL',
      vibration: [400, 200]
    });
    try {
      this.push.setDefaultChannel(channel);
    }
    catch {
      console.error('Failed to reset Default channel..');
    }
  }

  public getNewToken() {
    return from(this.push.getToken()).pipe(
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  public getApnsToken() {
    (async () => {
      await this.push.getAPNSToken();
    })();

    return this.push.onApnsTokenReceived().pipe(
      take(1),
      tap(apnTok => console.log(`FcmSvc->getRefreshToken()  :::  token :::    ${apnTok} `)),
      map(apnTok => <string>apnTok),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  public async getPermissions(): Promise<boolean> {
    const isPermited = await this.push.hasPermission();
    if (isPermited) {
      return true;
    }
    else {
      this.push.grantPermission().then(promt => {
        if (promt) {
          return this.getPermissions();
        }
      });
    }
  }


  private combineTokens(tokens: string[] | string | undefined, token: string) {
    if (!token) return null;

    let tokensArr = [];
    if (tokens && typeof tokens !== 'undefined') {
      if (tokens instanceof Array) {
        if (tokens.includes(token)) {
          console.log(`PushSvc->combineTokens:::::: Already have token ${token} in ${tokens}`);
          return null;
        }
        tokensArr = [...tokens, token];
      } else {
        if (tokens == token) {
          console.log(`PushSvc->combineTokens:::::: Already have token ${token} in ${tokens}`);
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
