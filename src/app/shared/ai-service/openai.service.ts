import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {

  constructor(private http: HttpClient) {
  }

  analyzePdfFromFirebase(pdfFileName: string): Observable<OpenAIChatResponse> {
    return this.http.post<OpenAIChatResponse>('/api/analyze-pdf-firebase', { pdfFileName });
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



