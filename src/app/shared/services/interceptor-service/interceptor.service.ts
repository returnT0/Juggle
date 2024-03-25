import { Injectable } from '@angular/core';
import {HttpEvent, HttpHandler, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {finalize} from "rxjs/operators";
import {NgxSpinnerService} from "ngx-spinner";

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {
  constructor(private spinner: NgxSpinnerService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.spinner.show();
    return next.handle(req).pipe(finalize(() => this.spinner.hide()));
  }
}
