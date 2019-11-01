import { Injectable } from '@angular/core';
import { from, throwError, of, Observable } from 'rxjs';
import { catchError, shareReplay, map, concatMap } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn, SnapshotAction, DatabaseSnapshot } from '@angular/fire/database';
import firebase from 'firebase'
import { IChatMsg } from 'src/app/models/IChatMsg';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(private fDb: AngularFireDatabase) { }

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
    return this.fDb.list(path).valueChanges().pipe(
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
    )
  }


}
