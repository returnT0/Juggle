import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConditionService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
  }

  fetchAllConditions(pdfId?: string): Observable<{ predefined: Condition[], saved: Condition[] }> {
    let params = new HttpParams();
    if (pdfId) {
      params = params.set('pdfId', pdfId);
    }
    return this.http.get<{
      predefined: Condition[],
      saved: Condition[]
    }>(`${this.baseUrl}/fetch-all-conditions`, {params});
  }

  createCondition(text: string, pdfId: string): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    const body = {text, pdfId};
    return this.http.post(`${this.baseUrl}/create-condition`, body, {headers});
  }

  applyConditionsToPdf(pdfId: string, conditionIds: string[]): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    const body = {pdfId, conditionIds};
    return this.http.post(`${this.baseUrl}/apply-conditions-to-pdf`, body, {headers});
  }

  removeConditionFromPdf(pdfId: string, conditionId: string): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    const body = {pdfId, conditionId};
    return this.http.post(`${this.baseUrl}/remove-condition-from-pdf`, body, {headers});
  }

  fetchAppliedConditions(pdfId: string): Observable<any[]> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    return this.http.get<any[]>(`${this.baseUrl}/fetch-applied-conditions?pdfId=${pdfId}`, {headers});
  }
}

export interface Condition {
  id: string;
  text: string;
}
