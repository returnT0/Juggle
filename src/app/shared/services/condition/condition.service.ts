import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConditionService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  fetchAllConditions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fetch-all-conditions`);
  }

  createCondition(text: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-condition`, { text });
  }

  editCondition(id: string, text: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/edit-condition/${id}`, { text });
  }
}
