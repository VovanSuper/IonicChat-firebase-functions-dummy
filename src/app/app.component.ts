import { Component, OnDestroy } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { PushService } from 'src/app/services/push.service';
import { ToastrService, ToastResultType } from 'src/app/services/toastr.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { BackbtnService } from './services/backbtn.service';

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
    private toastr: ToastrService,
    private backBtnHandler: BackbtnService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent();
      this.splashScreen.hide();

      if (this.platform.is('android')) {
        // this.bgModeSvc.keepWorkingBg();
        this.backBtnHandler.handleHardwareBackBtnHandler().subscribe(
          val => console.log(val),
          err => console.error(err)
        );
      } else if (this.platform.is('ios')) {
        this.pushSvc.getPermissions().then(_isIosPermiss => {
          if (_isIosPermiss) {
            this.pushSvc.getApnsToken();
          }
        });
      }

      this.pushSvc.getNewToken().subscribe(
        val => console.log(`New FCM Token ::: ${val}`),
        err => console.warn(err)
      );

      this.pushSvc.setChannel().then(_ => {
        this.pushSvc.onMessage().pipe(untilDestroyed(this)).subscribe(
          (val) => {
            const { title, body, data } = val;
            return this.toastr.getToast({
              header: title || 'New Message received !',
              message: `${body} -- ${JSON.stringify(data)}  `,
              duration: 5000,
              operationResult: ToastResultType.NEUTRAL
            });
          });
      });
    });
  }

  ngOnDestroy() { }

}
