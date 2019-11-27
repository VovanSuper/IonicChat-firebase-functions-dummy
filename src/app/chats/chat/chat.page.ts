import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { mergeMap, concatMap, map, combineLatest, take, filter } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

import { UserService } from 'src/app/services/user.service';
import { IUser } from 'src/app/models/IUser';
import { ChatService } from 'src/app/services/chats.service';
import { IChatMsg } from 'src/app/models/IChatMsg';
import { IonContent } from '@ionic/angular';
import { userAva, partnerAva } from './avatar'
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('contentScroll', { static: false }) contentScroll: IonContent;
  newMessage = '';
  currentUser: IUser = null;
  currentPartner: IUser = null;
  // messages$ : Observable<IChatMsg[]>;
  messages: IChatMsg[] = [];
  user$: Observable<IUser>;
  partner$: Observable<IUser>;
  userAvatarData = userAva;
  partnerAvatarData = partnerAva;

  constructor(private accRoute: ActivatedRoute, private userSvc: UserService, private chatSvc: ChatService) { }

  ngOnInit() {
    this.partner$ = this.accRoute.params.pipe(
      untilDestroyed(this),
      concatMap(
        (paramMap: Params) => {
          let partnerID = paramMap['id'];
          return this.userSvc.getDbUserById(partnerID);
        }),
      concatMap(currPart => {
        this.currentPartner = currPart;
        console.log(`Currnet Partner ::: ${JSON.stringify(this.currentPartner)}`);
        return of(this.currentPartner);
      })
    );

    this.getMessagesForCurrPartner();
  }

  ngAfterViewInit() {
    this.clearMsg();
  }

  send(message: string) {
    this.chatSvc.createChatMsg({ currUserID: this.currentUser.id, currPartnerID: this.currentPartner.id, message }).pipe(
      take(1),
      concatMap(val => {
        return of(val);
      })
    ).subscribe(_ => {
      this.getMessagesForCurrPartner();
      this.clearMsg();
    })
  }

  private getMessagesForCurrPartner() {
    this.user$ = this.userSvc.getCurrentUserInfo().pipe(
      filter(user => !!user),
      untilDestroyed(this),
      mergeMap(
        currUsr => {
          this.currentUser = currUsr;
          return of(this.currentUser as IUser);
        }));

    // this.messages$ = user$.pipe(
    this.user$.pipe(
      untilDestroyed(this),
      combineLatest(this.partner$),
      // combineLatest(partner$, user$).pipe(
      concatMap(([user, partner]) => {
        return this.chatSvc.getUserMessagesWithPartner({ userId: user.id, partnerId: partner.id }).pipe(
          map((chatmsgs: []) => {
            console.log(chatmsgs);
            return [...chatmsgs] as IChatMsg[];
            // return chatmsgs as IChatMsg[];
          })
        );
      })
    )
      .subscribe(msgs => {
        this.messages = msgs;
      });
  }

  private scrollToBottom(duration = 300) {
    if (this.contentScroll && this.contentScroll !== undefined) {
      this.contentScroll.scrollToBottom(duration);
    }
    else {
      setTimeout(this.scrollToBottom.bind(this), 100);
    }
  }

  private clearMsg() {
    this.newMessage = '';
    this.scrollToBottom(200);
  }

  ngOnDestroy() { }

}
