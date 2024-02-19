import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {UploadService} from "../shared/upload.service";

@Component({
  selector: 'app-pdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrl: './pdfviewer.component.css'
})
export class PdfviewerComponent implements OnInit {
  public pdfSrc: string = '';

  constructor(private route: ActivatedRoute, private uploadService: UploadService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const pdfId = params['id'];
      this.fetchPdfUrlById(pdfId);
    });
  }

  fetchPdfUrlById(pdfId: string): void {
    this.uploadService.getPDFUrlById(pdfId).then(url => {
      this.pdfSrc = url;
    }
    ).catch(error => console.error(error));
  }
}
