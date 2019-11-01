import { Injectable } from '@angular/core';
import { QueryFn } from '@angular/fire/database';
import { tap, mergeMap, catchError, map, distinctUntilChanged, concatMap } from 'rxjs/operators';
import { BehaviorSubject, throwError, iif, of, Observable, ReplaySubject, Subject } from 'rxjs';

import { DbService } from './db.service';
import { StorageService } from 'src/app/services/storage.service';
import { IUser } from 'src/app/models/IUser';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _currentUser$$: BehaviorSubject<Partial<IUser> | null>;
  // public allUsers$$: ReplaySubject<IUser[] | Array<Partial<IUser>>> = new ReplaySubject(0);

  constructor(private fDb: DbService, private storeSvc: StorageService) {
    this._currentUser$$ = new BehaviorSubject({ id: this.storeSvc.get('user') });
  }

  getAllUsers({ query, postQueryFn }: { query?: QueryFn, postQueryFn?: (val: Partial<IUser>) => boolean } = { query: null, postQueryFn: (val) => true }) {
    return new Observable<Array<IUser>>(inner => {
      // this.fDb.list(`users/`, query).pipe(
      this.fDb.list(`users/`).pipe(
        // distinctUntilChanged(),
        map(users => users as Array<IUser>),
        map(users => users.filter(postQueryFn) as Array<IUser>),
        // shareReplay({ bufferSize: 100, refCount: true })
      ).subscribe(
        val => {
          inner.next(val);
          // this.allUsers$$.next(val);
        },
        err => inner.error(err),
        () => inner.complete()
      );
    });
  }

  setCurrentId(id: string) {
    this.storeUser(id);
    this._currentUser$$.next({ id });
  }

  unsetCurrUserId(id: string = null) {
    this.delUser();
    this._currentUser$$.next({ id: null });
  }

  getCurrentUserInfo(): Observable<IUser | null> {
    return this._currentUser$$.asObservable().pipe(
      // distinctUntilChanged(),
      concatMap((currUser: Partial<IUser>) => iif(() => (currUser && ('id' in currUser)), this.getDbUserById((currUser) ? currUser.id : null), of(null))),
      tap(user => console.log(`[UserSvc->getCurrentUserInfo()] :::::::::     ${JSON.stringify(user)}`)),
      catchError(err => {
        // console.warn(`[UserSvc->getCurrentUserInfo()]:::: ${JSON.stringify(err)}`);
        return throwError(err);
      })
    );
  }

  public upsertDbUser({ id, name, email = '' }: Partial<IUser>) {
    return this.fDb.set(`users/${id}`, { id, name, email });
  }

  getDbUserById(uId: string): Observable<IUser> {
    return this.fDb.get(`users/${uId}`).pipe(
      map(user => user as IUser)
      // tap(data => console.log(`User obj ::::   ${JSON.stringify(data)}`))
    );
  }

  private storeUser = (id: any) => this.storeSvc.set('user', id);
  private delUser = () => this.storeSvc.clear();

}