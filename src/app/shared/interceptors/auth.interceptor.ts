import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AngularFireAuth) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.auth.idToken.pipe(
      take(1),
      switchMap(idToken => {
        if (idToken) {
          const cloned = request.clone({
            setHeaders: {
              Authorization: `Bearer ${idToken}`
            }
          });
          return next.handle(cloned);
        } else {
          return next.handle(request);
        }
      })
    );
  }
}
