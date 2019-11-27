import { Injectable } from '@angular/core';
import { from, throwError, of, Observable } from 'rxjs';
import { catchError, shareReplay, map, concatMap } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn, SnapshotAction, DatabaseSnapshot, ChildEvent } from '@angular/fire/database';
import { AngularFireMessaging, AngularFireMessagingModule } from "@angular/fire/messaging";
import firebase from 'firebase'
import { IChatMsg } from 'src/app/models/IChatMsg';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(private fDb: AngularFireDatabase, private fMsg: AngularFireMessaging) { }

  listSnapshots(path: string, query: QueryFn = null) {
    return new Observable(inner => {
      this.fDb.list(path, query).snapshotChanges(['child_added']).pipe(
        // shareReplay({ bufferSize: 1, refCount: true, windowTime: 300 }),
        concatMap((vals) => {
          let chats = vals.map(val => val.payload.val())
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

  listChats(path: string, query: QueryFn = null) {
    const snapshotEvents: ChildEvent[] = ['child_added', 'child_removed'];
    return this.fDb.list(path).snapshotChanges(snapshotEvents).pipe(
      map(val => {
        val
      })
    )
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
    )
  }


}
