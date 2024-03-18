import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {OpenaiService} from "../shared/ai-service/openai.service";

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  responseText: string | null = null;
  selectedFile: File | null = null;
  constructor(private router: Router, private openaiService: OpenaiService) {}

  handleFileInput(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let files: FileList | null = element.files;
    if (files && files.length > 0) {
      this.selectedFile = files.item(0);
    }
  }

  uploadPDF() {
    if (this.selectedFile) {
      this.openaiService.uploadAndAnalyzePdf(this.selectedFile).subscribe({
        next: (response) => {
          if (response.choices.length > 0) {
            this.responseText = response.choices[0].message.content;
          } else {
            this.responseText = "No response from the assistant.";
          }
        },
        error: (error) => {
          console.error("Error uploading and analyzing PDF:", error);
          this.responseText = "Failed to upload and analyze PDF";
        }
      });
    }
  }

}
