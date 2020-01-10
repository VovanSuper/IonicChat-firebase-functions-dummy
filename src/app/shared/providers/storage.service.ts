import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  set(key: string, val: any) {
    localStorage.setItem(key, val);
  }

  get(key: string) {
    return localStorage.getItem(key);
  }

  clear(key?: string) {
    if (key) {
      localStorage.removeItem(key)
    } else {
      localStorage.clear();
    }
  }
}
