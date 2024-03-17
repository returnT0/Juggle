import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private baseUrl = 'https://api.openai.com/v1';

  constructor(private http: HttpClient) {
  }

  generateText(messages: Array<{ role: string, content: string }>) {
    const url = `/api/openai`;
    const body = {
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 150
    };

    return this.http.post<OpenAIChatResponse>(url, body);
  }

  uploadAndAnalyzePdf(file: File): Observable<OpenAIChatResponse> {
    const formData: FormData = new FormData();
    formData.append('pdfFile', file, file.name);
    return this.http.post<OpenAIChatResponse>('/api/analyze-pdf', formData);
  }

  analyzePdfByUrl(pdfUrl: string): Observable<any> { // Use an appropriate type instead of any
    return this.http.post('/api/analyze-pdf-from-url', { pdfUrl });
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



