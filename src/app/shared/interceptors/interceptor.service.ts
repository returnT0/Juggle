import { Injectable } from '@angular/core';
import {HttpEvent, HttpHandler, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {finalize} from "rxjs/operators";
import {NgxSpinnerService} from "ngx-spinner";

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  constructor(private spinner: NgxSpinnerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const noSpinner = req.headers.get('no-spinner');

    if (!noSpinner) {
      this.spinner.show();
    }

    const authReq = req.clone({
      headers: req.headers.delete('no-spinner')
    });

    return next.handle(authReq).pipe(
      finalize(() => {
        if (!noSpinner) {
          this.spinner.hide();
        }
      })
    );
  }
}
