import { Injectable } from '@angular/core';
import { DbService } from 'src/app/services/db.service';
import { mergeMap, catchError, map, concatMap, tap, filter } from 'rxjs/operators';
import { of, throwError, combineLatest, Observable, BehaviorSubject } from 'rxjs';
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
    )
  }

  setCurrnetPartnerById(partnerID: string) {
    if (!partnerID.trim() || typeof partnerID.toString() !== 'string')
      throw new Error('Partners\' should be string');

    return this.userSvc.getDbUserById(partnerID).pipe(
      concatMap(partner => {
        this._partnerId$$.next(partner);
        return of(partner)
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
                  console.log(err)
                } else {
                  console.log('Successfully updated new msg record')
                }
              })
            })
          ),
          this.db.push(`chats/${currPartnerID}`, { messageKey: key }).pipe(
            map(newRef => {
              newRef.update({
                'from_': currUserID,
                'to_': currPartnerID
              }, (err) => {
                if (err) {
                  console.log(err)
                } else {
                  console.log('Successfully updated new msg record')
                }
              })
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

  getUserMessagesWithPartner({ userId, partnerId }: { userId: string; partnerId: string; }) {
    if (!userId || !partnerId) throw new Error('Both currnent user id and his Partner id should be provided ..! ');

    return new Observable(inner => {

      this.db.list(`chats/${userId}/`).pipe(
        // take(1),
        concatMap((vals: MessageType[]) => {
          let chatsArr$ = [...vals.map(val => this.getMessageForKey(val.messageKey))];
          // let chatsArr$ = Object.entries(vals).map(val => this.getChatsforMsgKey(val[1].messageKey))
          // let chats$ = this.getMessageForKey(vals[0].messageKey);
          return new Observable(subInner => {
            combineLatest(chatsArr$).subscribe(
              chats => subInner.next(chats),
              err => subInner.error(err),
              () => subInner.complete()
            );
          });
          // return chats$
          // return this.db.get(`/chats/messages/${vals[0].messageKey}`)
        }),
        // combineAl1l(),
        // filter((chats: IChatMsg[]) => {
        //   return chats.from == partnerId || chats.to == partnerId;
        // }),
        map((chats: IChatMsg[]) => {
          return filterChatsForParticipant(chats, partnerId);
        }),

        map((chats: IChatMsg[]) => {
          return setAreChatsOwned(chats, partnerId);
        }),

        // concatMap((chats: IChatMsg[]) => {
        //   let chatsForPartic = [];
        //   chats.forEach(chat => {
        //     if (chat.from == partnerId || chat.to == partnerId) {
        //       chatsForPartic.push(chat);
        //     }
        //   });
        //   return of(chatsForPartic);
        // }),
        // combineLatest(),
        // concatMap((obsOfObs) => {
        //   return obsOfObs$;
        // }),
        // tap(vals => console.log(vals)),
        // concatAll(),
        // map((msgs) => {
        //   return [msgs] as IChatMsg[]
        // })
        // combineLatest(),
        // concatMap((chats) => {
        //   return of(chats) //as IChageMsg[];
        // })
      ).subscribe(val => {
        inner.next(val);
      }, err => {
        inner.error(err);
      },
        () => inner.complete());
    })
  }


  private getMessageForKey(messageKey: string): Observable<IChatMsg> {
    if (!messageKey) throw new Error('Message Key should be provided ....');

    return new Observable(inner => {
      let chat$ = this.db.get(`/chats/messages/${messageKey}`).pipe(
        // tap(val => console.log(`Message ::: ${JSON.stringify(val)}`)),
        map(val => val as IChatMsg)
        // map((valsObj = {}) => {
        //   return [...Object.keys(valsObj).map(key => valsObj[key])]
        // })
        // tap(val => console.log(`Message ::: ${val}`)),
      );
      chat$.subscribe(
        val => {
          inner.next(val);
        },
        err => {
          inner.error(err)
        },
        () => inner.complete()
      );
    });
  }


}

const filterChatsForParticipant = (chats: IChatMsg[], partnerId: string): IChatMsg[] => {
  if (!partnerId || typeof partnerId === 'undefined') {
    throw new Error('Participant ID should be provided ... got empty ..!');
  }
  return chats.filter(chat => (chat.from === partnerId || chat.to === partnerId));
}

const setAreChatsOwned = (chats: IChatMsg[], partnerID: string): Array<IChatMsg & { isSelfMsg: boolean }> => {
  return chats.map(chat => setIsMsgUserOwned(chat, partnerID));
}

const setIsMsgUserOwned = (chat: IChatMsg, partnerId: string): IChatMsg & { isSelfMsg: boolean } => {
  return { ...chat, isSelfMsg: (chat.from !== partnerId && chat.to === partnerId) };
}

export type MessageType = {
  messageKey: string
}