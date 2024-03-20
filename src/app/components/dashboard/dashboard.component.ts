import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadService } from "../../shared/upload-service/upload.service";
import { Subscription } from "rxjs";
import {Router} from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  message: string = '';
  showMessage: boolean = false;
  showOptions!: boolean;
  fileNameInput: string = '';
  showInput!: boolean;
  pdfUrls: { id: string; url: string; title: string; path: string; }[] = [];
  private sub!: Subscription;

  constructor(private uploadService: UploadService, private router: Router) {}

  ngOnInit(): void {
    this.refreshPdfList();
  }

  refreshPdfList(): void {
    setTimeout(() => {
      this.uploadService.fetchAllPDFs().subscribe(files => {
        this.pdfUrls = files.map(file => ({
          id: file.id,
          url: file.url,
          title: this.extractTitleFromUrl(file.url),
          path: file.path
        }));
      }, error => console.error(error));
    }, 1000);
  }

  private extractTitleFromUrl(url: string): string {
    url = decodeURIComponent(url);

    const cleanUrl = url.split('?')[0];

    const urlParts = cleanUrl.split('/');
    let fileName = urlParts[urlParts.length - 1];

    fileName = fileName.replace(/\.\w+$/, '');

    const nameParts = fileName.split('_');
    if (nameParts.length > 1) {
      nameParts.shift();
      fileName = nameParts.join('_');
    }

    return fileName;
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  async uploadFiles(event: any) {
    const files: FileList = event.target.files;
    const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf");

    if (pdfFiles.length > 0) {
      let fileName = "";
      if (pdfFiles.length === 1) {

        this.displayMessage({
          message: "Please enter a name for the PDF file:",
          duration: 0,
          showOptions: true,
          showInput: true,
          onYes: (fileNameInput) => {
            fileName = fileNameInput;
            proceedWithUpload();
          },
          onNo: () => console.log("File upload canceled."),
        });
      } else {

        this.displayMessage({
          message: "Please enter a name for the merged PDF file:",
          duration: 0,
          showOptions: true,
          showInput: true,
          onYes: (fileNameInput) => {
            fileName = fileNameInput;
            proceedWithUpload(true);
          },
          onNo: () => console.log("Merging canceled by the user."),
        });
      }

      const proceedWithUpload = (merge = false) => {

        this.displayMessage({
          message: `Uploading ${merge ? "merged" : ""} PDF...`,
          duration: 1000,
          showOptions: false,
          showInput: false,
        });

        const uploadOperation = merge
          ? this.uploadService.uploadMergedPDF(pdfFiles, fileName)
          : this.uploadService.uploadFile(pdfFiles[0], fileName);

        uploadOperation.then(() => {
          this.displayMessage({
            message: `PDF uploaded successfully!`,
            duration: 3000,
            showOptions: false,
            showInput: false,
          });
          this.refreshPdfList();
        }).catch((error) => {
          console.error("Upload failed:", error);
          this.displayMessage({
            message: "Failed to upload PDF.",
            duration: 3000,
            showOptions: false,
            showInput: false,
          });
        });
      };
    } else {
      console.error("No PDF files selected or the selected files are not PDFs.");
    }
  }

  deletePdf(filePath: string, index: number): void {
    this.displayMessage({
      message: 'Are you sure you want to delete this PDF?',
      duration: 0,
      showOptions: true,
      showInput: false,
      onYes: () => this.confirmDeletePdf(filePath, index),
      onNo: () => console.log('Deletion canceled by the user.')
    });
  }

  async confirmDeletePdf(filePath: string, index: number): Promise<void> {
    try {
      await this.uploadService.deleteFile(filePath);
      this.pdfUrls.splice(index, 1); // Remove the item from the list
      console.log("PDF deleted successfully");

      this.displayMessage({
        message: 'PDF deleted successfully.',
        duration: 3000,
        showOptions: false,
      });
    } catch (error) {
      console.error("Failed to delete PDF:", error);

      this.displayMessage({
        message: 'Failed to delete PDF. Please try again later.',
        duration: 5000,
        showOptions: false,
      });
    }
  }

  viewPdf(pdfId: string): void {
    // Encode the pdfId
    const encodedPdfId = btoa(pdfId);

    // Create a URL tree with the encoded pdfId
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/view-pdf', encodedPdfId])
    );

    // Open the URL in a new tab
    window.open(url, '_blank');
  }


  displayMessage({message, duration, showOptions = false, showInput = false, onYes, onNo}: { message: any, duration: any, showOptions?: boolean, showInput?: boolean, onYes?: (fileNameInput: string) => void, onNo?: () => void }) {
    this.message = message;
    this.showMessage = true;
    this.showOptions = showOptions;
    this.showInput = showInput;


    this.fileNameInput = '';

    this.onYesCallback = () => {
      if(onYes) onYes(this.fileNameInput);
      this.showMessage = false;
    };
    this.onNoCallback = onNo;

    if(duration > 0) {
      setTimeout(() => {
        this.showMessage = false;
        this.showOptions = false;
        this.showInput = false;
      }, duration);
    }
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
    this.showMessage = false;
  }
}
