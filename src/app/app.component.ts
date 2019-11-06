import { Component, OnDestroy } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { PushService } from 'src/app/services/push.service';
import { ToastrService, ToastResultType } from 'src/app/services/toastr.service';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnDestroy {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private pushSvc: PushService,
    private toastr: ToastrService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.pushSvc.getNewToken().subscribe(
        val => console.log(`New FCM Token ::: ${val}`),
        err => console.warn(err)
      )
      // this.pushSvc.setTokenForUserId().subscribe(
      //   val => console.log(val),
      //   err => console.error(err),
      //   () => console.log('compl...')
      // );

      this.pushSvc.onMessage().pipe(untilDestroyed(this)).subscribe(
        (val) => {
          let { title, body, data } = val;
          return this.toastr.getToast({
            header: title || 'New Message received !',
            message: `${body} -- ${JSON.stringify(data)}  ` || 'This is a push',
            duration: 5000,
            operationResult: ToastResultType.NEUTRAL
          })
        })
    });
  }

  ngOnDestroy() { }

}
