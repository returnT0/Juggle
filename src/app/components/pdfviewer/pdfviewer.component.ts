import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {UploadService} from '../../shared/services/upload/upload.service';
import {Subscription} from 'rxjs';
import {OpenaiService} from "../../shared/services/ai/openai.service";
import {ConditionService} from "../../shared/services/condition/condition.service";
import {PatternService} from "../../shared/services/pattern/pattern.service";

@Component({
  selector: 'app-pdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.css'],
})
export class PdfviewerComponent implements OnInit, OnDestroy {
  pdfSrc: string = '';
  currentPdfId: string = '';
  cleanedFileName: string = '';
  analysisResponse: string = '';
  conditions: {
    text: string;
    visible: boolean
  }[] = [];
  showOverlay = false;
  showPattern = false;
  patterns: {
    id: string;
    name: string;
    conditions: {
      text: string;
      visible: boolean
    }[]
  }[] = [];
  appliedPatterns: number[] = [];
  editingPatternIndex: number | null = null;
  savedConditions: Condition[] = [];
  selectedCondition: string = 'makeYourOwn';
  newConditionValue: string = '';
  secondaryOptions: {
    [key: string]: string[] } = {
    predefined: [],
    saved: []
  };
  secondarySelection: string = '';

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private uploadService: UploadService,
    private pdfAnalysisService: OpenaiService,
    private conditionService: ConditionService,
    private patternService: PatternService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe((params) => {
      const encodedPdfId = params['id'];
      const pdfId = atob(encodedPdfId);
      this.currentPdfId = pdfId;

      this.fetchPdfUrlById(pdfId).then(() => {
        this.loadConditionsFromStorage()
        this.loadAllConditions();
        this.loadAllPatterns();
      });
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadAllConditions(): void {
    this.conditionService.fetchAllConditions(this.currentPdfId).subscribe({
      next: (data) => {
        this.secondaryOptions['predefined'] = data.predefined.map(c => c.text);
        this.savedConditions = data.saved;
      }, error: (error) => console.error('Error fetching conditions:', error)
    });
  }

  loadAllPatterns(): void {
    this.patternService.fetchAllPatterns(this.currentPdfId).subscribe({
      next: (patterns) => {
        this.patterns = patterns.map(pattern => ({
          ...pattern,
          conditions: pattern.conditions.map((condition: Condition) => ({
            text: condition.text,
            visible: condition.visible ?? true
          }))
        }));
      },
      error: (error) => console.error('Error fetching patterns:', error)
    });
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
      this.updateConditionsInStorage();

      if (this.selectedCondition === 'makeYourOwn') {
        this.newConditionValue = '';
      } else {
        this.secondarySelection = '';
      }
    } else if (conditionExists) {
      console.warn('Condition already exists:', conditionValue);
    }
  }

  updateConditionsInStorage(): void {
    const pdfId = this.extractPdfIdFromSrc(this.pdfSrc);
    localStorage.setItem(`pdfConditions_${pdfId}`, JSON.stringify(this.conditions));
  }

  loadConditionsFromStorage(): void {
    const pdfId = this.extractPdfIdFromSrc(this.pdfSrc);
    const storedConditions = localStorage.getItem(`pdfConditions_${pdfId}`);
    if (storedConditions) {
      this.conditions = JSON.parse(storedConditions);
    }
  }

  extractPdfIdFromSrc(pdfSrc: string): string {
    return pdfSrc.substring(pdfSrc.lastIndexOf('/') + 1, pdfSrc.indexOf('?'));
  }

  saveCondition(): void {
    if (this.newConditionValue && !this.savedConditions.find(condition => condition.text === this.newConditionValue)) {
      this.conditionService.createCondition(this.newConditionValue, this.currentPdfId).subscribe({
        next: (response) => {
          const newCondition: Condition = {text: response.text, visible: true};
          this.savedConditions.push(newCondition);
          this.secondaryOptions['saved'] = this.savedConditions.map(c => c.text);
          this.newConditionValue = '';
        }, error: (error) => {
          console.error('Failed to save condition:', error);
        }
      });
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

  deletePattern(patternId: string, patternIndex: number): void {
    this.patternService.deletePattern(patternId).subscribe({
      next: (response) => {
        console.log('Pattern deleted successfully:', response);
        // Remove the pattern from the list if deletion was successful
        this.patterns.splice(patternIndex, 1);
      },
      error: (error) => console.error('Failed to delete pattern:', error),
    });
  }

  addPattern(): void {
    const patternName = `pattern_${this.patterns.length + 1}`;
    const newPattern = {
      id: `temp-${Date.now()}`,
      name: patternName,
      conditions: [...this.conditions],
    };

    const isDuplicate = this.patterns.some(pattern =>
      pattern.conditions.length === newPattern.conditions.length &&
      pattern.conditions.every(pc =>
        newPattern.conditions.some(nc => nc.text === pc.text))
    );

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

  private fetchPdfUrlById(pdfId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.uploadService.getPDFUrlById(pdfId)
        .then((url) => {
          this.pdfSrc = url;
          this.cleanedFileName = this.extractFileNameFromUrl(url);
          this.cdr.detectChanges();
          resolve();
        })
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  }

  private extractFileNameFromUrl(url: string): string {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const queryParamIndex = fileName.indexOf('?');
    if (queryParamIndex !== -1) {
      return fileName.substring(0, queryParamIndex);
    }
    return fileName;
  }
}

interface Condition {
  text: string;
  visible?: boolean;
}
