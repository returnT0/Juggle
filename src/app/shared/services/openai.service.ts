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
    const url = `${this.baseUrl}/chat/completions`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openai_api_key}`
    });

    const body = {
      model: "gpt-3.5-turbo", // Adjusted for chat
      messages: messages, // Adjusted for chat
      temperature: 0.7,
      max_tokens: 150
    };

    return this.http.post<OpenAIChatResponse>(url, body, { headers });
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
