import { Injectable } from '@angular/core';
import { from, throwError, of, Observable, Subscriber } from 'rxjs';
import { catchError, map, concatMap, tap, take } from 'rxjs/operators';
import { AngularFireDatabase, QueryFn, ChildEvent, SnapshotAction } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(private fDb: AngularFireDatabase) { }

  listSnapshots<T>({ path, query, snapEvents }: { path: string; query?: QueryFn; snapEvents?: string[]; } = { path: '', query: null, snapEvents: ['child_added'] }): Observable<T[]> {
    return new Observable((inner: Subscriber<T[]>) => {
      const events: Array<ChildEvent> = snapEvents as Array<ChildEvent>;
      this.fDb.list(path, query).snapshotChanges(events).pipe(
        // shareReplay({ bufferSize: 1, refCount: true, windowTime: 300 }),
        concatMap((vals: Array<SnapshotAction<T>>) => {
          let chats = vals.map(val => val.payload.exists() && val.payload.val() as T);
          return of(chats);
        }),
        // tap(vals => console.log(`[dbSvc->listSnapshots()] :: new snapshot ${JSON.stringify(vals)}`)),
        catchError((err) => {
          console.error(`[DbService->listSnapshots()] ::::::::   ${JSON.stringify(err)}`);
          return of(null);
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
      // map((vals = []) => {
      //   console.log(`VALS ::::::::::::: ${JSON.stringify(vals)}`);
      //   return vals;
      // }),
      catchError((err) => {
        console.error(`[DbService->list()]::::::::   ${JSON.stringify(err)}`);
        return of(null);
      })
      // ).subscribe(
      //   val => inner.next(val),
      //   err => inner.error(err),
      //   () => inner.complete()
      // );
      // });
    );
  }

  update<T>(path: string, data: object) {
    return from(this.fDb.object<T>(path).update(data));
  }

  set<T>(path: string, data: T) {
    return from(this.fDb.object<T>(path).set(data));
  }

  push<T>(path: string, data = {}) {
    // let pushID = this.fDb.createPushId();
    // data = { ...data, pushID };
    return from(this.fDb.database.ref(`${path}`).push(data));
  }

  get<T>(path: string) {
    return this.fDb.object<T>(path).valueChanges().pipe(
      catchError((err) => {
        console.error(`[DbService->get()]::::::::   ${JSON.stringify(err)}`);
        return throwError(err);
      })
    );
  }

  async getSnapshot<T>(path = 'chats/messages'): Promise<T> {
    const item = await (this.fDb.database.ref(path).once('value'));
    return item.exists() && (item.toJSON() as T);
  }


}
