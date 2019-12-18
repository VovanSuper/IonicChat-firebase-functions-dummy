import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AnonymousGuard implements CanActivate {

  constructor(private userSvc: UserService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.userSvc.getCurrentUserInfo().pipe(
      map(currUser => {
        if (currUser && currUser.id) {
          this.router.navigateByUrl('/chats');
          return false;
        }
        return !!!currUser;
      })
    );
  }

}
