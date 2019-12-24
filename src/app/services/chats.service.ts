import { Injectable } from '@angular/core';
import { DbService } from 'src/app/services/db.service';
import { mergeMap, catchError, map, concatMap, tap, filter } from 'rxjs/operators';
import { of, throwError, combineLatest, Observable, BehaviorSubject, from } from 'rxjs';
import { IChatMsg } from 'src/app/models/IChatMsg';
import { IUser } from 'src/app/models/IUser';
import { UserService } from 'src/app/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _partnerId$$: BehaviorSubject<IUser> = new BehaviorSubject(null);
  partner$: Observable<IUser>;

  constructor(private db: DbService, private userSvc: UserService) {
    this.partner$ = this._partnerId$$.pipe(
      map(usr => usr as IUser)
    );
  }

  setCurrnetPartnerById(partnerID: string) {
    if (!partnerID.trim() || typeof partnerID.toString() !== 'string')
      throw new Error('Partners\' should be string');

    return this.userSvc.getDbUserById(partnerID).pipe(
      concatMap(partner => {
        this._partnerId$$.next(partner);
        return of(partner);
      }),
      catchError(err => {
        this._partnerId$$.error(err);
        return throwError(err);
      })
    );
  }

  createChatMsg({ currUserID, currPartnerID, message }: { currUserID: string; currPartnerID: string; message: string; }) {
    let now = Date.now();
    return this.db.push(`chats/messages`, { message, date: now, from: currUserID, to: currPartnerID }).pipe(
      map(val => val.key),
      concatMap(key => {
        // return this.db.push(`chats/${currUserID}`, { messageKey: key }).pipe(
        //   mergeMap(_ => {
        //     this.db.push(`chats/${currPartnerID}`, { messageKey: key });
        //     return of(_);
        //   })
        // )
        return combineLatest(
          this.db.push(`chats/${currUserID}`, { messageKey: key }).pipe(
            map(newRef => {
              newRef.update({
                'from_': currUserID,
                'to_': currPartnerID
              }, (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Successfully updated new msg record');
                }
              });
            })
          ),
          this.db.push(`chats/${currPartnerID}`, { messageKey: key }).pipe(
            map(newRef => {
              newRef.update({
                'from_': currUserID,
                'to_': currPartnerID
              }, (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log('Successfully updated new msg record');
                }
              });
            })
          )
        );
      }),
      concatMap(res => {
        // console.log(`${JSON.stringify(res)}`);
        return of(res);
      }),
      catchError(err => {
        console.log(`Error saving Chat message:::::::    ${JSON.stringify(err)}`);
        return throwError(err);
      })
    );
  }

  // getUserMessagesWithPartner({ userId, partnerId }: { userId: string; partnerId: string; }): Observable<Array<IChatMsg>> {
  getUserMessagesWithPartner({ userId, partnerId }: { userId: string; partnerId: string; }): Observable<IChatMsg[]> {
    if (!userId || !partnerId) throw new Error('Both currnent user id and his Partner id should be provided ..! ');

    return this.db.listSnapshots<MessageType>({ path: `chats/${userId}/`, query: null, snapEvents: ['child_added', 'child_removed'] }).pipe(
      concatMap((vals: MessageType[]) => {
        return from(
          Promise.all(
            [...vals.map(val => this.getMessageForKey(val.messageKey))]
          )
        );
      }),
      map((chats: IChatMsg[]) => {
        return filterChatsForParticipant(chats, partnerId);
      }),

      map((chats: IChatMsg[]) => {
        return setAreChatsOwned(chats, partnerId);
      })
    );
  }



  private getMessageForKey(messageKey = '') {
    if (!messageKey || !messageKey.trim().length) throw new Error('Message Key should be provided ....');

    return this.db.getSnapshot<IChatMsg>(`/chats/messages/${messageKey}`) as Promise<IChatMsg>;
  }


}

const filterChatsForParticipant = (chats: IChatMsg[], partnerId: string): IChatMsg[] => {
  if (!partnerId || typeof partnerId === 'undefined') {
    throw new Error('Participant ID should be provided ... got empty ..!');
  }
  return chats.filter(chat => (chat.from === partnerId || chat.to === partnerId));
};

const setAreChatsOwned = (chats: IChatMsg[], partnerID: string): Array<IChatMsg> => {
  return chats.map(chat => setIsMsgUserOwned(chat, partnerID));
};

const setIsMsgUserOwned = (chat: IChatMsg, partnerId: string): IChatMsg => {
  return { ...chat, isSelfMsg: (chat.from !== partnerId && chat.to === partnerId) };
};

export type MessageType = {
  messageKey: string;
  to_: string;
  from_: string;
};