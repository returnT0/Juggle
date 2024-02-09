import {Component, OnInit} from '@angular/core';
import {UploadService} from "../shared/upload.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  message: string = '';
  showMessage: boolean = false;
  showOptions!: boolean;
  pdfUrls: string[] = [];
  private sub!: Subscription;

  constructor(private uploadService: UploadService) {}

  ngOnInit(): void {
    this.sub = this.uploadService.fetchAllPDFs().subscribe(urls => {
      this.pdfUrls = urls;
    }, error => console.error(error));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  uploadFile(event : any) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      this.uploadService.uploadFile(file);
    } else {
      console.error("Only PDF files are supported.");
    }
  }


  displayMessage({message, duration, showOptions = false, onYes, onNo}: { message: any, duration: any, showOptions?: boolean, onYes?: () => void, onNo?: () => void }) {
    this.message = message;
    this.showMessage = true;
    this.showOptions = showOptions;

    this.onYesCallback = onYes;
    this.onNoCallback = onNo;

    setTimeout(() => {
      this.showMessage = false;
      this.showOptions = false;
    }, duration);
  }

  onYesCallback?: () => void;
  onNoCallback?: () => void;

  handleYes() {
    if (this.onYesCallback) this.onYesCallback();
    this.showMessage = false;
  }

  handleNo() {
    if (this.onNoCallback) this.onNoCallback();
    console.log('User declined to reset password.');
    this.showMessage = false;
  }

  cancel(): void {
    this.showMessage = false
  }
}

export interface GridItem {
  id?: number;
  title: string;
  description: string;
  link: string;
}
