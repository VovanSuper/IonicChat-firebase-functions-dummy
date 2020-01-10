import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { tap, catchError, map, distinctUntilChanged, concatMap, filter, shareReplay } from 'rxjs/operators';
import { BehaviorSubject, throwError, iif, of, Observable, Subject } from 'rxjs';
import { QueryFn } from '@angular/fire/database';

import { DbService } from './db.service';
import { StorageService } from './storage.service';
import { UtilsService } from './utils.service';
import { IUser } from '@models/index';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _currentUser$$: BehaviorSubject<Partial<IUser> | null>;
  private _exit$$: Subject<boolean> = new Subject();
  public exit$: Observable<boolean>;

  constructor(private fDb: DbService, private storeSvc: StorageService,  private alertCtrl: AlertController, private utilsSvc: UtilsService) {
    this._currentUser$$ = new BehaviorSubject({ id: this.storeSvc.get('user') });
    this.exit$ = this._exit$$.asObservable();
  }

  getAllUsersExptSelf({ query, postQueryFn }: { query?: QueryFn; postQueryFn?: (val: Partial<IUser>) => boolean; } = { query: null, postQueryFn: (val) => true }) {
    return new Observable<Array<IUser>>(inner => {
      this.fDb.list(`users/`, query).pipe(
        filter(users => !!users),
        map(users => users as Array<IUser>),
        map(users => users.filter(postQueryFn) as Array<IUser>),
        catchError(err => {
          console.error(`UserSvc->getAllUsersExptSelf() :: ${JSON.stringify(err)}`);
          return throwError(err);
        })
        // shareReplay({ bufferSize: 100, refCount: true })
      ).subscribe(
        val => inner.next(val),
        err => inner.error(err),
        () => inner.complete()
      );
    });
  }

  setCurrentId(id: string = null) {
    this.storeUser(id);
    this._currentUser$$.next({ id });
  }

  unsetCurrUserId(id: string = null) {
    this.delUser();
    this._currentUser$$.next({ id: null });
  }

  getCurrentUserInfo(): Observable<IUser | null> {
    return this.CurrentUserID.pipe(
      filter(({ id = null }: Partial<IUser> = { id: null }) => !!id),
      concatMap(({ id = null }: Partial<IUser> = { id: null }) => iif(() => (!!id), this.getDbUserById((!!id) ? id : null), of(null))),
      // tap(user => console.log(`[UserSvc->getCurrentUserInfo()] :::::::::     ${JSON.stringify(user)}`)),
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(err => {
        console.warn(`[UserSvc->getCurrentUserInfo()]:::: ${JSON.stringify(err)}`);
        return throwError(err);
      })
    );
  }

  get CurrentUserID(): Observable<Partial<IUser> | null> {
    return this._currentUser$$.asObservable().pipe(
      map(({ id = null, ...rest }: Partial<IUser> = { id: null }) => {
        return { id };
      }),
      distinctUntilChanged()
    );
  }

  public upsertDbUser({ id, name, email = '' }: Partial<IUser>) {
    if (!id || !name) throw new Error('uID and Name should be provided ..!');
    return this.fDb.set(`users/${id}`, { id, name, email });
  }

  getDbUserById(uId: string): Observable<IUser> {
    if (!!!uId) throw new Error('Please provide uID ..!');

    return this.fDb.get<IUser | Partial<IUser>>(`users/${uId}`).pipe(
      map(user => user as IUser),
      // tap(data => console.log(`[UserSvc->getDbUserById()]:::: User obj ::::   ${JSON.stringify(data)}`))
    );
  }

  async exit() {
    const topAlert = await this.alertCtrl.getTop();
    if (topAlert && topAlert !== undefined) {
      topAlert.dismiss();
    }
    let exitAlert = await this.alertCtrl.create({
      animated: true,
      // mode: 'ios',
      backdropDismiss: true,
      header: 'Exit the App?',
      message: 'Are you sure, you want to exit?',
      // subHeader: 'exit',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: this.minimizeApp
        }
      ]
    });
    await exitAlert.present();
    return exitAlert;
  }

  async logout(showDial = { modal: true }) {
    if (!showDial || !showDial.modal) {
      return this.utilsSvc.clearAll().then(_noTok => {
        location.pathname = '/pub/m/login';
      });
    }
    const topAlert = await this.alertCtrl.getTop();
    if (topAlert && topAlert !== undefined) {
      topAlert.dismiss();
    }
    let logoutAlert = await this.alertCtrl.create({
      animated: true,
      // mode: 'md',
      backdropDismiss: true,
      header: 'Logout?',
      message: 'Do you want to logout?',
      // subHeader: 'exit',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            this.utilsSvc.clearAll().then(_noTok => {
              location.pathname = '/pub/m/login';
              // this.utils.navigateRoot('/pub/m/login');
              return;
            })
          }
        }
      ]
    });
    await logoutAlert.present();
    return logoutAlert;
  }

  private minimizeApp() {
    try {
      // return this.appMinimize.minimize().then(_exitVal => {
      let navApp = navigator && navigator['app'];
      if (navApp && ('exitApp' in navApp)) {
        navApp.exitApp();
        this._exit$$.next(true);
        this._exit$$.complete();
      }
      // });
    }
    catch (err) {
      return console.error(err);
    }
  }

  private storeUser = (id: any) => this.storeSvc.set('user', id);
  private delUser = () => this.storeSvc.clear();

}