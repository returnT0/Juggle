import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {UploadService} from '../../shared/services/upload/upload.service';
import {Subscription} from 'rxjs';
import {OpenaiService} from "../../shared/services/ai/openai.service";

@Component({
  selector: 'app-pdfviewer', templateUrl: './pdfviewer.component.html', styleUrls: ['./pdfviewer.component.css'],
})
export class PdfviewerComponent implements OnInit, OnDestroy {
  pdfSrc: string = '';
  cleanedFileName: string = '';
  analysisResponse: string = '';
  conditions: { text: string; visible: boolean }[] = [];
  showOverlay = false;
  showPattern = false;
  patterns: { name: string; conditions: { text: string; visible: boolean }[] }[] = [];
  appliedPatterns: number[] = [];
  editingPatternIndex: number | null = null;
  savedConditions: string[] = [];
  selectedCondition: string = 'makeYourOwn';
  newConditionValue: string = '';
  secondaryOptions: { [key: string]: string[] } = {
    textPatternExtraction: [], extractStructuredData: [], Saved: this.savedConditions,
  };
  secondarySelection: string = '';

  private routeSub!: Subscription;

  constructor(private route: ActivatedRoute, private uploadService: UploadService, private pdfAnalysisService: OpenaiService) {
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe((params) => {
      const encodedPdfId = params['id'];
      const pdfId = atob(encodedPdfId);
      this.fetchPdfUrlById(pdfId);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  analyzePdf(fileName: string): void {
    this.pdfAnalysisService.analyzePdfFromFirebase(fileName).subscribe({
      next: (response) => {
        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
          this.analysisResponse = response.choices[0].message.content;
        } else {
          this.analysisResponse = 'Received unexpected response structure from the analysis service.';
        }
      }, error: (error) => {
        console.error('Error analyzing PDF:', error);
        this.analysisResponse = 'Error analyzing PDF: ' + error.message;
      }
    });
  }

  toggleOverlay(): void {
    this.showOverlay = !this.showOverlay;
  }

  togglePattern(): void {
    this.showPattern = !this.showPattern;
  }

  toggleVisibility(index: number): void {
    this.conditions[index].visible = !this.conditions[index].visible;
  }

  addCondition(): void {
    let conditionValue = this.selectedCondition === 'makeYourOwn' ? this.newConditionValue : this.secondarySelection;
    const conditionExists = this.conditions.some((condition) => condition.text === conditionValue);

    if (conditionValue && !conditionExists) {
      this.conditions.push({text: conditionValue, visible: true});
      if (this.selectedCondition === 'makeYourOwn') {
        this.newConditionValue = '';
      } else {
        this.secondarySelection = '';
      }
    } else if (conditionExists) {
      console.warn('Condition already exists:', conditionValue);
    }
  }

  saveCondition(): void {
    if (this.newConditionValue && !this.savedConditions.includes(this.newConditionValue)) {
      this.savedConditions.push(this.newConditionValue);
      this.secondaryOptions['Saved'] = [...this.savedConditions];
    } else {
      console.warn('Condition is empty or already saved:', this.newConditionValue);
    }
  }

  savePatternChanges(patternIndex: number): void {
    this.editingPatternIndex = null;
  }

  cancelEditing(): void {
    this.editingPatternIndex = null;
  }

  togglePatternConditions(patternIndex: number): void {
    const patternConditions = this.patterns[patternIndex].conditions;
    if (this.appliedPatterns.includes(patternIndex)) {
      this.conditions = this.conditions.filter(c => !patternConditions.some(pc => pc.text === c.text));
      this.appliedPatterns = this.appliedPatterns.filter(i => i !== patternIndex);
    } else {
      patternConditions.forEach(pc => {
        if (!this.conditions.some(c => c.text === pc.text)) {
          this.conditions.push({...pc});
        }
      });
      this.appliedPatterns.push(patternIndex);
    }
  }

  deletePattern(patternIndex: number): void {
    this.patterns.splice(patternIndex, 1);

  }

  addPattern(): void {
    const patternName = `pattern_${this.patterns.length + 1}`;
    const newPattern = {
      name: patternName, conditions: [...this.conditions],
    };

    const isDuplicate = this.patterns.some(pattern => pattern.conditions.length === newPattern.conditions.length && pattern.conditions.every(pc => newPattern.conditions.some(nc => nc.text === pc.text)));

    if (!isDuplicate) {
      this.patterns.push(newPattern);
    } else {
      alert('A pattern with the exact same conditions already exists.');
    }
  }

  onSecondarySelectionChange(value: string): void {
    this.secondarySelection = value;
  }

  deleteCondition(index: number): void {
    this.conditions.splice(index, 1);
  }

  onPrimarySelectionChange(value: string): void {
    this.selectedCondition = value;
    this.secondarySelection = '';
  }

  private fetchPdfUrlById(pdfId: string): void {
    this.uploadService
      .getPDFUrlById(pdfId)
      .then((url) => {
        this.pdfSrc = url;
        this.cleanedFileName = this.extractFileNameFromUrl(url); // Store the cleaned file name
      })
      .catch((error) => console.error(error));
  }

  private extractFileNameFromUrl(url: string): string {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const queryParamIndex = fileName.indexOf('?');
    if (queryParamIndex !== -1) {
      // Remove query parameters if present
      return fileName.substring(0, queryParamIndex);
    }
    return fileName;
  }
}
