import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export enum ToastResultType {
  SUCCESS = 'success',
  FAIL = 'warning',
  NEUTRAL = 'light'
}

@Injectable({
  providedIn: 'root'
})
export class ToastrService {
  private toast: HTMLIonToastElement = null;

  constructor(private toastCtrl: ToastController) { }

  public getToast = async ({ header, message, duration = 1000, operationResult }: { header: string, message: string, duration: number, operationResult: ToastResultType; })
    : Promise<HTMLIonToastElement> => {
    if (this.toast && this.toast != undefined) {
      return Promise.resolve(this.toast);
    }
    const topToastr = await this.toastCtrl.getTop();
    if (topToastr && topToastr == this.toast) {
      this.toast.dismiss();
    }
    const newToast = await this.toastCtrl.create({
      duration: duration,
      animated: true,
      color: operationResult,
      header,
      message,
      showCloseButton: true
    });
    await newToast.present();
    return newToast;
  };

  public dismissToast = (toast: HTMLIonToastElement = null): Promise<boolean> => {
    if (toast) {
      if (this.toast && toast == this.toast) {
        return this.toast.dismiss();
      } else {
        return toast.dismiss();
      }
    } else if (this.toast && this.toast !== undefined) {
      return this.toast.dismiss();
    } else {
      return Promise.resolve(false);
    }

  };
}