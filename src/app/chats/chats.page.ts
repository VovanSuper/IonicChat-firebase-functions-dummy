import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, of, combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { concatMap, catchError, filter, map } from 'rxjs/operators';

import { UserService } from '@services/user.service';
import { AuthService } from '@services/auth.service';
import { IUser } from '@models/index';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
})
export class ChatsPage implements OnInit, OnDestroy {
  private currUser$: Observable<IUser>;
  private chats$: Observable<IUser[]>;
  private title$: Observable<string>;

  public error$ = new Subject<string>();
  public vm$: Observable<{ currUser: IUser, chats: IUser[]; title: string; }>;

  constructor(private router: Router, private userSvc: UserService, private authSvc: AuthService) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.currUser$ = this.userSvc.getCurrentUserInfo().pipe(
      untilDestroyed(this),
      // tap(usr => console.log(`[ChatsPage->ionViewWillEnter()]:: curr user ${JSON.stringify(usr)}`))
    );
    this.chats$ = this.currUser$.pipe(
      untilDestroyed(this),
      concatMap((currUser: Partial<IUser>) => {
        return this.userSvc.getAllUsersExptSelf({ postQueryFn: (item: IUser) => item.id !== currUser.id });
      }),
      map((users = []) => [...users] as Array<IUser>),
      catchError(err => {
        console.warn(err);
        this.error$.next(err);
        return of(null);
      })
    );
    this.title$ = this.currUser$.pipe(
      untilDestroyed(this),
      filter(usr => !!usr),
      map(usr => `Hello ${usr.name}`)
    );

    this.vm$ = combineLatest(
      this.currUser$,
      this.chats$,
      this.title$
    ).pipe(
      filter(currUser => !!currUser),
      map(([currUser, chats, title]) => {
        return { currUser, chats, title };
      })
    );
  }

  logout() {
    this.authSvc.logOut().subscribe(
      _ => console.log('You logged out ..!')
      , err => console.warn(err)
    );
  }

  gotoChat(id: string) {
    return this.router.navigate(['/chats', id]);
  }

  ngOnDestroy() {

  }

}
