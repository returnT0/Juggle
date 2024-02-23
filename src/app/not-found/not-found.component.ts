import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {OpenaiService} from "../shared/services/openai.service";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  responseText: string | null = null; // Add this line

  constructor(private router: Router, private openaiService: OpenaiService) {}

  callOpenAI() {
    const messages = [
      {role: 'user', content: 'Hello, world!'}
    ];
    // Assuming messages is already defined or passed correctly
    this.openaiService.generateText(messages).subscribe(response => {
      if (response.choices.length > 0 && response.choices[0].message) {
        this.responseText = response.choices[0].message.content; // Correctly extract the response content
      } else {
        this.responseText = "No response from the assistant.";
      }
    }, error => {
      console.error("Error calling OpenAI:", error);
      this.responseText = "Failed to get response";
    });
  }

}
