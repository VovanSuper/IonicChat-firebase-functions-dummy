import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanLoad, Route, UrlSegment } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class IsAuthGuard implements CanActivate, CanLoad {

  constructor(private userSvc: UserService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.userSvc.CurrentUser.pipe(
      map(({ id }) => {
        if (!!!id) {
          this.router.navigateByUrl('/auth/login');
          return false;
        }
        return !!id;
      })
    );
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    return this.userSvc.getCurrentUserInfo().pipe(
      map(({ id }) => {
        if (!!!id) {
          this.router.navigateByUrl('/auth/login');
          return false;
        }
        return !!id;
      })
    );
  }

}
