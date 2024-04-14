import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatternService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
  }

  fetchAllPatterns(pdfId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (pdfId) {
      params = params.set('pdfId', pdfId);
    }

    return this.http.get<any[]>(`${this.apiUrl}/fetch-all-patterns`, {params});
  }

  createPattern(name: string, conditionIds: string[], pdfId: string): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    const body = {name, conditionIds, pdfId};
    return this.http.post(`${this.apiUrl}/create-pattern`, body, {headers});
  }

  applyPatternsToPdf(pdfId: string, patternIds: string[]): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    const body = {pdfId, patternIds};
    return this.http.post(`${this.apiUrl}/apply-patterns-to-pdf`, body, {headers});
  }

  editPattern(id: string, newName: string, pdfId: string): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    const body = {newName, pdfId};
    return this.http.put(`${this.apiUrl}/edit-pattern/${id}`, body, {headers});
  }

  deletePattern(patternId: string): Observable<any> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    return this.http.delete(`${this.apiUrl}/delete-pattern/${patternId}`, {headers});
  }
}
