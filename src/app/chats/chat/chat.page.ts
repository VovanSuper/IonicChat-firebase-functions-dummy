import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { concatMap, map, take, filter, switchMap, combineLatest as combineLatestWith, catchError } from 'rxjs/operators';
import { of, Observable, combineLatest, Subject } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';

import { UserService } from '@services/user.service';
import { ChatService } from '@services/chats.service';
import { AuthService } from '@services/auth.service';
import { IChatMsg, IUser } from '@models/index';
import { userAva, partnerAva } from './avatar';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements AfterViewInit, OnDestroy {
  @ViewChild('contentScroll', { static: false }) contentScroll: IonContent;
  newMessage = '';
  userAvatarData = userAva;
  partnerAvatarData = partnerAva;
  private messages$: Observable<IChatMsg[]> = null;
  private user$: Observable<IUser> = null;
  private partner$: Observable<IUser> = null;
  private title$: Observable<string> = of('No chat..!');
  
  public error$ = new Subject<string>();
  public vm$: Observable<{ currentUser: IUser, currentPartner: IUser; messages: Array<IChatMsg>; title: string; }> = null;

  constructor(private accRoute: ActivatedRoute, private userSvc: UserService, private chatSvc: ChatService, private authSvc: AuthService) { }

  ionViewWillEnter() {
    this.user$ = this.userSvc.getCurrentUserInfo().pipe(
      filter(user => !!user),
      map(user => user as IUser),
      untilDestroyed(this)
    );
    this.partner$ = this.accRoute.params.pipe(
      untilDestroyed(this),
      switchMap((paramMap: Params) => {
        let { id } = paramMap;
        return this.userSvc.getDbUserById(id) as Observable<IUser>;
      })
    );
    this.messages$ = this.getMessagesForCurrPartner().pipe(
      catchError(err => {
        console.warn(`ChatPage->Messages::: ${JSON.stringify(err)}`);
        this.error$.next(err);
        return of(null);
      })
    );
    this.title$ = this.partner$.pipe(
      filter(partner => !!partner),
      map(partner => `Chat to ${partner.name}`)
    );

    this.vm$ = combineLatest(
      this.user$,
      this.partner$,
      this.messages$,
      this.title$
    ).pipe(
      filter(user => !!user),
      map(([currentUser, currentPartner, messages, title]) => {
        return { currentUser, currentPartner, messages, title };
      })
    );
  }

  ngAfterViewInit() {
    this.clearMsgBox();
  }

  send(currUserID: string, currPartnerID: string, message = '') {
    this.chatSvc.createChatMsg({ currUserID, currPartnerID, message }).pipe(
      take(1),
      map(val => {
        console.log(`New Message sent : ${val}`);
        return val;
      })
    ).subscribe(_ => {
      this.messages$ = this.getMessagesForCurrPartner();
      this.clearMsgBox();
    });
  }

  private getMessagesForCurrPartner() {
    return this.user$.pipe(
      untilDestroyed(this),
      filter(user => !!user),
      combineLatestWith(this.partner$),
      concatMap(([user, partner]) => this.chatSvc.getUserMessagesWithPartner({ userId: user.id, partnerId: partner.id })),
      map((chats = []) => chats as IChatMsg[] | [])
    );
  }

  private scrollToBottom(duration = 300) {
    if (this.contentScroll && typeof this.contentScroll !== 'undefined') {
      this.contentScroll.scrollToBottom(duration);
    }
    else {
      setTimeout(this.scrollToBottom.bind(this), 100);
    }
  }

  private clearMsgBox() {
    this.newMessage = '';
    this.scrollToBottom(200);
  }

  logOut() {
    this.authSvc.logOut();
    return;
  }

  ngOnDestroy() { }

}
