import { Injectable } from '@angular/core';

import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class UtilsService {

  constructor(private storeSvc: StorageService) { }

  public clearAll() {
    return Promise.resolve(this.storeSvc.clear());
  }
}