import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/IUser';
import { QueryFn } from '@angular/fire/database';
import { Router } from '@angular/router';
import { Observable, throwError, combineLatest } from 'rxjs';
import { concatMap, map, catchError, tap, filter } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
})
export class ChatsPage implements OnInit, OnDestroy {
  private currUser$: Observable<IUser>;
  private chats$: Observable<IUser[]>;
  private title$: Observable<string>;
  public vm$: Observable<{ currUser: IUser, chats: IUser[]; title: string; }>;

  constructor(private router: Router, private userSvc: UserService, private authSvc: AuthService) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.currUser$ = this.userSvc.getCurrentUserInfo().pipe(
      untilDestroyed(this),
      tap(usr => console.log(`[ChatsPage->ionViewWillEnter()]:: curr user ${JSON.stringify(usr)}`))
    );
    this.chats$ = this.currUser$.pipe(
      untilDestroyed(this),
      concatMap((currUser: Partial<IUser>) => {
        return this.userSvc.getAllUsersExptSelf({ postQueryFn: (item: IUser) => item.id !== currUser.id });
      }),
      map((users = []) => [...users] as Array<IUser>),
      catchError(err => {
        console.warn(err);
        return throwError(err);
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
