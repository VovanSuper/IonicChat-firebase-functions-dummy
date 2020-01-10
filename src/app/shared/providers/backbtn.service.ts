import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterEvent, NavigationStart } from '@angular/router';
import { Platform } from '@ionic/angular';
import { BackButtonEvent, BackButtonEventDetail } from '@ionic/core';
import { Subject, of, Observable, throwError } from 'rxjs';
import { takeUntil, tap, filter, concatMap, combineLatest, map } from 'rxjs/operators';

import { UserService } from './user.service';
import { ToastrService } from './toastr.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BackbtnService {
  prevNavPath = null;

  closeLatestModal$: Subject<any> = new Subject();
  currNavPath = '/';
  isAuth$: Observable<boolean>;

  startWithUri = null;
  navStack: string[] = [];

  // lastRoutingData = { lastId: 0, lastUrl: '' };
  navEndData = { isRoutEnd: false, countDown: 0 };
  maxCountToExit = 2;

  constructor(
    private location: Location,
    private platform: Platform,
    private userSvc: UserService,
    private authSvc: AuthService,
    private router: Router,
    private toastSvc: ToastrService
  ) {
    this.isAuth$ = this.userSvc.CurrentUserID.pipe(map(({ id }) => !!id));
    // this.getRouting().subscribe(console.log)
    // this.handleHardwareBackBtnHandler().subscribe(console.log)
  }



  // private setIniPath() {
  //   this.startWithUri = this.location.path();
  //   this.navStack = [this.startWithUri];
  // }

  // private navPop() {
  //   return this.navStack.pop();
  // }

  // private get _navlength() {
  //   return this.navStack.length;
  // }

  // private clearNav() {
  //   console.log('Resetting nav Stack...!');
  //   this.startWithUri = this.location.path();
  //   this.navStack = [];
  // }

  private get routing$() {
    return this.router.events.pipe(
      // startWith(new RouterEvent(0, '/m/event/list')),
      filter((ev: RouterEvent) => ev instanceof NavigationStart),
      tap(_ev => console.log(`Nav Start event fired ::  ${JSON.stringify(_ev)}`)),
      tap(_ev => this.currNavPath = this.location.path()),
      // concatMap(ev => {
      //   if (ev.url == '' || ev.url == '/') {
      //     setTimeout(() => {
      //       this.router.navigateByUrl('/m/event/list', { replaceUrl: true });
      //     }, 200);
      //   }
      //   return of(ev);
      // }),
      tap(ev => console.log(JSON.stringify(ev))),
      // tap(ev => {
      //   if (ev.url == '' || ev.url == '/') {
      //     this.exitApp();
      //   }
      // }),

      // concatMap(navEvnt => {
      //   this.navStack.push(navEvnt.url);
      //   this.navStack = this.navStack
      //     .filter(path => path !== '')
      //     .filter(path => path !== '/')
      //     .filter(path => {
      //       if (path.indexOf('pub/m/login') !== path.lastIndexOf('/pub/m/login')) {
      //         return path.indexOf('?redirectUrl=') < 0;
      //       } else {
      //         return true;
      //       }
      //     });
      //   this.navStack = [...(new Set(this.navStack))];
      //   return of(navEvnt);
      // })
    );
  }

  closeModalEmit(backEv: BackButtonEventDetail) {
    if (history.state && ('dialog' in history.state)) {
      this.closeLatestModal$.next({ dialog: history.state['dialog'] });
      console.log('Theres a dialog in history' + this.prevNavPath);

      return throwError(`Closing dialog ${history.state['dialog']}`);
    } else {
      return of(backEv);
    }
  }

  handleHardwareBackBtnHandler() {
    let backBtn$ = this.platform.backButton.asObservable();

    return backBtn$.pipe(
      takeUntil(this.userSvc.exit$),
      tap(_ => console.log('Hardware BackBtn clicked')),
      tap(_ => this.toastSvc.dismissToast()),

      // tap(_ => this.prevNavPath = this._navlength && this.navPop()),
      // tap(_ => console.log(`Popped nav path: ${this.prevNavPath}`)),
      // map(_ => {
      //   if (!this.prevNavPath || this.prevNavPath == undefined || this.prevNavPath == '/' || this._navlength < 1) {
      //     this.exitApp();
      //     console.log('Exiting app... due to prevNavPath ==  ' + this.prevNavPath);
      //     return null;
      //   }
      // }),
      concatMap(backEv => {
        if (history.state && ('dialog' in history.state)) {
          this.closeLatestModal$.next({ dialog: history.state['dialog'] });
          console.log('Theres a dialog in history' + this.prevNavPath);

          return throwError(`Closing dialog ${history.state['dialog']}`);
        } else {
          return of(backEv);
        }
      }),
      // map(backEv => {
      //   console.log('Prev Nav Path::::    ', this.prevNavPath);
      //   if (this.prevNavPath == '/' || this.prevNavPath == '' || this._navlength < 1) {
      //     console.log('The prevNavPath ==  ' + this.prevNavPath);
      //     return null;
      //   } else {
      //     return backEv;
      //   }
      // }),
      // concatMap(backEvent => {
      //   return from(
      //     this.modalCtrl.getTop().then(ionModal => {
      //       if (ionModal) {
      //         throw new Error('Had Ionic Modal...let it be closed... exiting...');
      //       } else {
      //         return backEvent;
      //       }
      //     })
      //   )
      // }),
      // withLatestFrom(isAuth$),
      combineLatest(this.routing$, this.isAuth$),
      concatMap(([backEv, routingEv, isAuth]) => {
        // let navStartUrl
        if (!backEv || !routingEv) {
          // this.router.navigateByUrl(this.prevNavPath);
          return of(void 0);
        }

        let { id, url } = routingEv;
        // if (id == this.lastRoutingData.lastId && url == this.lastRoutingData.lastUrl) {
        if ((isAuth && url.includes('/event/list')) || (!isAuth && url.includes('/m/login'))) {
          console.log('End of nav stack seems to be reached... Counting down...');
          let { countDown, ...rest } = this.navEndData;
          this.navEndData = { countDown: countDown++, isRoutEnd: true };
          this.setExitCoutDown();
          if (this.maxCountToExit < 1) {
            this.exitApp();
          }
        }
        else {
          // this.lastRoutingData = { lastId: id, lastUrl: url };
          this.restoreExitCountDown();
        }


        return of({ backEv, routingEv });
      }),
      tap(_ => {
        this.prevNavPath = this.location.path();
      })
      // concatMap(([backBtnEv, isAuth]) => {
      //   if (!backBtnEv) {
      //     return of('Back Event handled above..!');
      //   }

      //   let currPath = this.location.path();
      //   let currState = this.location.getState();
      //   console.log('Current Path  :: ', currPath);
      //   console.log('Current State  :: ', currState);

      //   if (currPath == '/') {
      //     this.exitApp();
      //     return of('Exiting app ... on Path ---', currPath);
      //   }
      //   console.log(`User is Authenticated::::  ${isAuth}`);
      //   if (!isAuth) {
      //     if (this.prevNavPath.startsWith('/pub/m/login') || currPath == '' || currPath == '/') {
      //       this.exitApp();
      //       return of('Exiting app... on Path ---', currPath);
      //     }
      //   } else {
      //     if ('dialog' in history.state) {
      //       this.closeLatestModal$.next({ dialog: history.state['dialog'] });
      //       return of(`Currentpath :: ${currPath},   CurrnetState is ${JSON.stringify(history.state)}`);
      //     }
      //     if (this.navStackSvc.length < 1) {
      //       this.exitApp();
      //       return of('Exiting app ... on Path :  ', currPath);
      //     }
      //     if (this.prevNavPath == '/') {
      //       this.exitApp();
      //       return of('Exiting app ... on Path :  ', currPath);
      //     }
      //     if (this.prevNavPath == '/m/event/list' && this.navStackSvc.length < 2) {
      //       this.exitApp();
      //       return of('Exiting app...')
      //     }
      //   }

      // }),
      // catchError(err => {
      //   console.log('NAVIGATION ERROR!!!!!!!!!!!!!!!!!!');
      //   console.log(err);
      //   return throwError(err)
      // })
    );

  }

  private setExitCoutDown() {
    this.maxCountToExit = this.maxCountToExit - 1;
  }
  private restoreExitCountDown() {
    this.maxCountToExit = 3;
  }

  private exitApp() {
    return this.userSvc.exit();

  }
}
