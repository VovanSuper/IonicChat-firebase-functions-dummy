import { NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
// import { FirebaseAuthentication } from '@ionic-native/firebase-authentication/ngx';
// import { NativeStorage } from '@ionic-native/native-storage/ngx';

@NgModule({})
export class ProvidersModule {
  constructor(@Optional() @SkipSelf() isSelf: ProvidersModule) {
    if (isSelf)
      throw new Error('[SharedServicesModule] Should only be imported in App.module');
  }

  static forRoot(): ModuleWithProviders<ProvidersModule> {
    return {
      ngModule: ProvidersModule,
      providers: [
        StatusBar,
        SplashScreen,
        Camera,
        HTTP,
        FirebaseX,
        // FirebaseAuthentication,
        // NativeStorage,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      ]
    };
  }
}


// Participant onboard is the message with the 