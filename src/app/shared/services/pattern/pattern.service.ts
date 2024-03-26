import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatternService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  fetchPattern(patternId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fetch-pattern/${patternId}`);
  }

  fetchAllPatterns(pdfId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (pdfId) {
      params = params.set('pdfId', pdfId);
    }

    return this.http.get<any[]>(`${this.apiUrl}/fetch-all-patterns`, { params });
  }

  createPattern(name: string, conditionIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-pattern`, { name, conditionIds });
  }

  editPattern(id: string, newName: string, newConditions: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/edit-pattern/${id}`, { newName, newConditions });
  }

  deletePattern(patternId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-pattern/${patternId}`);
  }
}
