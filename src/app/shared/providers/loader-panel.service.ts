import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoaderPanelService {
  loadingPnl: HTMLIonLoadingElement = null;

  constructor(private loadingCtrl: LoadingController) { }

  public getLoader = async (): Promise<HTMLIonLoadingElement> => {
    if (this.loadingPnl && typeof this.loadingPnl !== 'undefined' && !this.loadingPnl.hidden && this.loadingPnl.isConnected) {
      //   await this.dismissLoader(this.loadingPnl);
      return Promise.resolve(this.loadingPnl);
    }
    const topLoader = await this.loadingCtrl.getTop();
    if (topLoader && topLoader != undefined) {
      if (this.loadingPnl && this.loadingPnl === topLoader) {
        return Promise.resolve(this.loadingPnl);
      } else {
        this.loadingPnl = topLoader;
        return Promise.resolve(this.loadingPnl);
      }
    }
    else {
      let newLoader = await this.loadingCtrl.create({
        animated: true,
        backdropDismiss: false,
        translucent: true,
        message: 'Loading...',
        spinner: 'circular',
        duration: 5000
      });
      await newLoader.present();
      this.loadingPnl = newLoader;

      return this.loadingPnl;
    }
  };

  public dismissLoader = async (loader: HTMLIonLoadingElement = null): Promise<boolean> => {
    if (this.loadingPnl) {
      return this.loadingPnl.dismiss();
    }
    const topLoader = await this.loadingCtrl.getTop();
    if (topLoader) {
      if (loader && loader == topLoader) {
        if (loader == this.loadingPnl) {
          return this.loadingPnl.dismiss();
        } else {
          this.loadingPnl = null;
          return loader.dismiss();
        }
      }
      return topLoader.dismiss();
    }
    else {
      if (loader) {
        if (loader == this.loadingPnl) {
          return this.loadingPnl.dismiss();
        }
        if (this.loadingPnl) {
          this.loadingPnl = null;
        }
        return loader.dismiss();
      } else if (this.loadingPnl) {
        return this.loadingPnl.dismiss();
      }
      else {
        return Promise.reject(false);
      }
    }
  };
}
