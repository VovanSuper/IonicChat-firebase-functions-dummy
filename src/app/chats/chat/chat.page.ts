import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { concatMap, map, take, filter, switchMap, combineLatest as combineLatestWith } from 'rxjs/operators';
import { of, Observable, combineLatest } from 'rxjs';

import { UserService } from 'src/app/services/user.service';
import { IUser } from 'src/app/models/IUser';
import { ChatService } from 'src/app/services/chats.service';
import { IChatMsg } from 'src/app/models/IChatMsg';
import { IonContent } from '@ionic/angular';
import { userAva, partnerAva } from './avatar';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements AfterViewInit, OnDestroy {
  @ViewChild('contentScroll', { static: false }) contentScroll: IonContent;
  newMessage = '';
  messages$: Observable<IChatMsg[]> = null;
  user$: Observable<IUser> = null;
  partner$: Observable<IUser> = null;
  title$: Observable<string> = of('No chat..!');
  
  vm$: Observable<{ currentUser: IUser, currentPartner: IUser; messages: Array<IChatMsg>; title: string; }> = null;
  userAvatarData = userAva;
  partnerAvatarData = partnerAva;

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
        return this.userSvc.getDbUserById(id);
      })
    );
    this.messages$ = this.getMessagesForCurrPartner();
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
      map((chats = []) => {
        return chats as IChatMsg[];
      })
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
