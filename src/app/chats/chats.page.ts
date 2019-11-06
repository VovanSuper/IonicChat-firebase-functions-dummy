import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/IUser';
import { QueryFn } from '@angular/fire/database';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { concatMap, map, catchError } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
})
export class ChatsPage implements OnInit {
  currUser$: Observable<IUser>;
  chats = [];
  chats$: Observable<IUser[]> | Observable<Partial<IUser>[]>;

  constructor(private router: Router, private userSvc: UserService, private authSvc: AuthService) { }

  ngOnInit() {
    this.currUser$ = this.userSvc.getCurrentUserInfo().pipe(untilDestroyed(this));
    this.chats$ = this.currUser$.pipe(
      untilDestroyed(this),
      concatMap((currUser: Partial<IUser>) => {
        return this.userSvc.getAllUsers({ postQueryFn: (item: IUser) => item.id !== currUser.id })
      }),
      map(users => [...users] as IUser[]),
      catchError(err => {
        console.warn(err);
        return throwError(err);
      })
    )
  }

  logout() {
    this.authSvc.logOut().subscribe(
      _ => console.log('You logged out ..!')
      , err => console.warn(err)
    )
  }

  gotoChat(id: string) {
    return this.router.navigate(['/chats', id]);
  }

}
