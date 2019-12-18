import { Injectable } from '@angular/core';
import { from, throwError, of, Observable } from 'rxjs';
import { catchError, shareReplay, map, concatMap } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn, ChildEvent } from '@angular/fire/database';
import { AngularFireMessaging } from "@angular/fire/messaging";

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(private fDb: AngularFireDatabase, private fMsg: AngularFireMessaging) { }

  listSnapshots({ path, query = null, snaps }: { path: string; query?: QueryFn; snaps: string[]; } = { path: 'chats/', query: null, snaps: ['child_added'] }) {
    return new Observable(inner => {
      let events: Array<ChildEvent> = snaps as Array<ChildEvent>;
      this.fDb.list(path, query).snapshotChanges(events).pipe(
        // shareReplay({ bufferSize: 1, refCount: true, windowTime: 300 }),
        concatMap((vals) => {
          let chats = vals.map(val => val.payload.val());
          return of(chats);
        }),
        catchError((err) => {
          console.error(`[DbService->list()]::::::::   ${JSON.stringify(err)}`);
          return throwError(err);
        })
      ).subscribe(
        val => inner.next(val),
        err => inner.error(err),
        () => inner.complete()
      );
    });
  }


  list(path: string, query: QueryFn = null) {
    // return new Observable(inner => {
    return this.fDb.list(path, query).valueChanges().pipe(
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


}
