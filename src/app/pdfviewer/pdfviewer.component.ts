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
  conditions: { text: string; visible: boolean }[] = [];
  showOverlay = false;

  constructor(private route: ActivatedRoute, private uploadService: UploadService) {
  }

  toggleOverlay() {
    this.showOverlay = !this.showOverlay;
  }

  toggleVisibility(index: number) {
    this.conditions[index].visible = !this.conditions[index].visible;
  }


  addCondition(newConditionText: string) {
    if (newConditionText) {
      this.conditions.push({text: newConditionText, visible: true});
    }
  }

  deleteCondition(index: number) {
    this.conditions.splice(index, 1);
  }


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const pdfId = params['id'];
      this.fetchPdfUrlById(pdfId);
    });
  }

  fetchPdfUrlById(pdfId: string): void {
    this.uploadService.getPDFUrlById(pdfId).then(url => {
      this.pdfSrc = url;
    }).catch(error => console.error(error));
  }
}
