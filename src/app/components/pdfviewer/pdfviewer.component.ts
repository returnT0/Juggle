import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
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
  pdfSrc = '';
  currentPdfId = '';
  cleanedFileName = '';
  analysisResponse = '';
  conditions: Condition[] = [];
  showOverlay = false;
  showPattern = false;
  patterns: Pattern[] = [];
  appliedPatterns: number[] = [];
  selectedPatterns = new Set<number>();
  editingPatternIndex: number | null = null;
  savedConditions: Condition[] = [];
  selectedCondition = 'makeYourOwn';
  selectedPredefinedConditionId: string | null = null;
  selectedSavedConditionId: string | null = null;

  newConditionValue = '';
  secondaryOptions: SecondaryOptions = { predefined: [], saved: [] };

  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private uploadService: UploadService,
    private pdfAnalysisService: OpenaiService,
    private conditionService: ConditionService,
    private patternService: PatternService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.unsubscribeFromRouteParams();
  }

  private subscribeToRouteParams(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const encodedPdfId = params['id'];
      this.currentPdfId = atob(encodedPdfId);
      this.initializeComponentData();
    });
  }

  private unsubscribeFromRouteParams(): void {
    this.routeSub?.unsubscribe();
  }

  private initializeComponentData(): void {
    this.fetchPdfUrlById(this.currentPdfId)
      .then(() => {
        this.loadAppliedConditions();
        this.loadAllConditions();
        this.loadAllPatterns();
      })
      .catch(error => console.error('Initialization error:', error));
  }

  loadAllConditions(): void {
    this.conditionService.fetchAllConditions(this.currentPdfId).subscribe({
      next: (data) => {
        this.secondaryOptions.predefined = data.predefined.map((c) => ({ id: c.id, text: c.text }));
        console.log('Updated secondaryOptions:', this.secondaryOptions);
        this.savedConditions = data.saved;
      }, error: (error) => console.error('Error fetching conditions:', error)
    });
  }

  loadAppliedConditions(): void {
    this.conditionService.fetchAppliedConditions(this.currentPdfId).subscribe({
      next: (conditions) => {
        this.conditions = conditions.map((condition: Condition) => ({
          id: condition.id,
          text: condition.text,
          visible: condition.visible ?? true
        }));
      },
      error: (error) => console.error('Error fetching applied conditions:', error)
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

  addSelectedCondition(): void {
    if (this.selectedCondition === 'predefined' && this.selectedPredefinedConditionId) {
      this.addCondition(this.selectedPredefinedConditionId);
    } else if (this.selectedCondition === 'saved' && this.selectedSavedConditionId) {
      this.addCondition(this.selectedSavedConditionId);
    } else if (this.selectedCondition === 'makeYourOwn') {
      this.saveCondition();
    }
  }


  addCondition(conditionId: string): void {
    if (conditionId) {
      const existingCondition = this.conditions.find(condition => condition.id === conditionId);
      if (!existingCondition) {
        const selectedPredefinedCondition = this.secondaryOptions.predefined.find(condition => condition.id === conditionId);
        const selectedSavedCondition = this.savedConditions.find(condition => condition.id === conditionId);

        const selectedCondition = selectedPredefinedCondition || selectedSavedCondition;

        if (selectedCondition) {
          this.conditions.push({
            id: selectedCondition.id,
            text: selectedCondition.text,
            visible: true
          });
          console.log('Condition added:', selectedCondition);
        } else {
          console.warn('No condition found with ID:', conditionId);
        }
      } else {
        console.warn('Condition already exists:', conditionId);
      }
    } else {
      console.error('Condition ID is required to add a condition.');
    }
  }

  saveConditionsForPdf(): void {
    const conditionIds = this.conditions
      .filter(condition => condition.id)
      .map(condition => condition.id);

    if (conditionIds.length > 0) {
      this.conditionService.applyConditionsToPdf(this.currentPdfId, conditionIds).subscribe({
        next: () => console.log('Conditions saved successfully for PDF'),
        error: (error) => console.error('Error saving conditions for PDF:', error)
      });
    }
  }

  extractPdfIdFromSrc(pdfSrc: string): string {
    return pdfSrc.substring(pdfSrc.lastIndexOf('/') + 1, pdfSrc.indexOf('?'));
  }

  saveCondition(): void {
    if (this.newConditionValue && !this.savedConditions.find(condition => condition.text === this.newConditionValue)) {
      this.conditionService.createCondition(this.newConditionValue, this.currentPdfId).subscribe({
        next: (response) => {
          const newCondition: Condition = {id: response.id, text: response.text, visible: true};
          this.savedConditions.push(newCondition);
          this.secondaryOptions['saved'] = this.savedConditions;
          this.newConditionValue = '';
        },
        error: (error) => {
          console.error('Failed to save condition:', error);
        }
      });
    } else {
      console.warn('Condition is empty or already saved:', this.newConditionValue);
    }
  }

  savePatternChanges(): void {
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

  togglePatternSelection(pIndex: number): void {
    if (this.selectedPatterns.has(pIndex)) {
      this.selectedPatterns.delete(pIndex);
    } else {
      this.selectedPatterns.add(pIndex);
    }
  }

  applySelectedPatterns(): void {
    const patternIds = Array.from(this.selectedPatterns).map(index => this.patterns[index].id);

    this.patternService.applyPatternsToPdf(this.currentPdfId, patternIds).subscribe({
      next: (response) => {
        console.log('Patterns applied successfully:', response);
        this.conditions = [];
        response.appliedPatterns.forEach((pattern: any) => {
          pattern.conditions.forEach((condition: Condition) => {
            if (!this.conditions.some(c => c.id === condition.id)) {
              this.conditions.push({
                id: condition.id,
                text: condition.text,
                visible: true
              });
            }
          });
        });
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error applying patterns to PDF:', error)
    });
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
    const conditionIds = this.conditions.filter(c => c.id).map(c => c.id);

    const isDuplicate = this.patterns.some(pattern =>
      pattern.conditions.length === conditionIds.length &&
      pattern.conditions.every(pc => conditionIds.includes(pc.id))
    );

    if (!isDuplicate) {
      this.patternService.createPattern(patternName, conditionIds, this.currentPdfId).subscribe({
        next: (response) => {
          const createdPattern = {
            id: response.id,
            name: response.name,
            conditions: [...this.conditions.filter(c => conditionIds.includes(c.id))],
          };
          this.patterns.push(createdPattern);
          console.log('Pattern created successfully:', createdPattern);
        },
        error: (error) => console.error('Failed to create pattern:', error)
      });
    } else {
      alert('A pattern with the exact same conditions already exists.');
    }
  }

  deleteCondition(conditionId: string): void {
    this.conditionService.removeConditionFromPdf(this.currentPdfId, conditionId).subscribe({
      next: (response) => {
        console.log('Condition removed:', response.message);
        this.loadAppliedConditions();
      },
      error: (error) => console.error('Error removing condition:', error)
    });
  }

  onPrimarySelectionChange(newSelection: string): void {
    this.selectedCondition = newSelection;

    if (newSelection === 'predefined' && this.secondaryOptions.predefined.length > 0) {
      this.selectedPredefinedConditionId = this.secondaryOptions.predefined[0].id;
    } else if (newSelection === 'saved' && this.savedConditions.length > 0) {
      this.selectedSavedConditionId = this.savedConditions[0].id;
    } else {
      this.selectedPredefinedConditionId = null;
      this.selectedSavedConditionId = null;
    }
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
  id: string;
  text: string;
  visible?: boolean;
}

interface Pattern {
  id: string;
  name: string;
  conditions: Condition[];
  selected?: boolean;
}

interface SecondaryOptions {
  predefined: Condition[];
  saved: Condition[];
}
