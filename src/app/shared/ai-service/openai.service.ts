import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private baseUrl = 'https://api.openai.com/v1';

  constructor(private http: HttpClient) { }

  generateText(messages: Array<{role: string, content: string}>) {
    const url = `/api/openai`; // Updated to use the proxy endpoint
    const body = {
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 150
    };

    return this.http.post<OpenAIChatResponse>(url, body);
  }
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    message: {
      content: string,
      role: string
    }
  }>;
}
