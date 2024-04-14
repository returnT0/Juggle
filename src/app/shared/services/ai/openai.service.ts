import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {Observable} from "rxjs";
import {Condition} from "../condition/condition.service";

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {

  constructor(private http: HttpClient) {
  }

  analyzePdfFromFirebase(pdfFileName: string, conditions: Condition[]): Observable<OpenAIChatResponse> {
    const headers = new HttpHeaders().set('no-spinner', 'true');
    return this.http.post<OpenAIChatResponse>('/api/analyze-pdf-firebase', { pdfFileName, conditions }, { headers });
  }
}

interface OpenAIChatMessage {
  role: string;
  content: string;
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    message: OpenAIChatMessage;
    index: number;
  }>;
}



