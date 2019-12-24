import { Injectable } from '@angular/core';
import { from, throwError, of, Observable, Subscriber } from 'rxjs';
import { catchError, shareReplay, map, concatMap, tap, take } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn, ChildEvent, SnapshotAction } from '@angular/fire/database';
import { AngularFireMessaging } from "@angular/fire/messaging";
import { DataSnapshot } from '@angular/fire/database/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(private fDb: AngularFireDatabase, private fMsg: AngularFireMessaging) { }

  listSnapshots<T>({ path, query, snapEvents }: { path: string; query?: QueryFn; snapEvents?: string[]; } = { path: '', query: null, snapEvents: ['child_added'] }): Observable<T[]> {
    return new Observable((inner: Subscriber<T[]>) => {
      const events: Array<ChildEvent> = snapEvents as Array<ChildEvent>;
      this.fDb.list(path, query).snapshotChanges(events).pipe(
        // shareReplay({ bufferSize: 1, refCount: true, windowTime: 300 }),
        concatMap((vals: Array<SnapshotAction<T>>) => {
          let chats = vals.map(val => val.payload.exists() && val.payload.val() as T);
          return of(chats);
        }),
        tap(vals => console.log(`[dbSvc->listSnapshots()] :: new snapshot ${JSON.stringify(vals)}`)),
        catchError((err) => {
          console.error(`[DbService->listSnapshots()] ::::::::   ${JSON.stringify(err)}`);
          return throwError(err);
        })
      ).subscribe(
        val => inner.next(val),
        err => inner.error(err),
        () => inner.complete()
      );
    });
  }


  list<T>(path: string, query: QueryFn = null) {
    // return new Observable(inner => {
    return this.fDb.list<T>(path, query).valueChanges().pipe(
      // shareReplay({ bufferSize: 1, refCount: true, windowTime: 300 }),
      map(vals => {
        console.log(`VALS ::::::::::::: ${JSON.stringify(vals)}`);
        return vals;
      }),
      catchError((err) => {
        console.error(`[DbService->list()]::::::::   ${JSON.stringify(err)}`);
        return throwError(err);
      })
      // ).subscribe(
      //   val => inner.next(val),
      //   err => inner.error(err),
      //   () => inner.complete()
      // );
      // });
    );
  }

  update(path: string, data: object) {
    return from(this.fDb.object(path).update(data));
  }

  set(path: string, data = {}) {
    return from(this.fDb.object(path).set(data));
  }

  push(path: string, data = {}) {
    // let pushID = this.fDb.createPushId();
    // data = { ...data, pushID };
    return from(this.fDb.database.ref(`${path}`).push(data));
  }

  get(path: string) {
    return this.fDb.object(path).valueChanges().pipe(
      catchError((err) => {
        console.error(`[DbService->get()]::::::::   ${JSON.stringify(err)}`);
        return throwError(err);
      })
    );
  }

  getSnapshot<T>(path = 'chats/messages'): Promise<T> {
    return (this.fDb.database.ref(path).once('value')).then((item: DataSnapshot) => item.exists() && item.toJSON() as T);
  }


}
