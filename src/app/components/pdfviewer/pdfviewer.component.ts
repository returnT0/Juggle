import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {UploadService} from '../../shared/services/upload/upload.service';
import {Subscription} from 'rxjs';
import {OpenaiService} from "../../shared/services/ai/openai.service";
import {ConditionService} from "../../shared/services/condition/condition.service";
import {PatternService} from "../../shared/services/pattern/pattern.service";
import {jsPDF} from 'jspdf';

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
  patterns: Pattern[] = [];

  appliedPatterns: number[] = [];
  selectedPatterns = new Set<number>();
  editingPatternIndex: number | null = null;

  savedConditions: Condition[] = [];
  selectedCondition = 'makeYourOwn';
  selectedPredefinedConditionId: string | null = null;
  selectedSavedConditionId: string | null = null;

  newConditionValue = '';
  secondaryOptions: SecondaryOptions = {predefined: [], saved: []};

  message: string = '';
  showOverlay = false;
  showPattern = false;
  showMessage: boolean = false;
  showOptions!: boolean;
  patternName: string = '';
  showInput!: boolean;
  onYesCallback?: () => void;
  onNoCallback?: () => void;

  private routeSub: Subscription | undefined;
  private analysisSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private uploadService: UploadService,
    private pdfAnalysisService: OpenaiService,
    private conditionService: ConditionService,
    private patternService: PatternService,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.unsubscribeFromRouteParams();
  }

  loadAllConditions(): void {
    this.conditionService.fetchAllConditions(this.currentPdfId).subscribe({
      next: (data) => {
        this.secondaryOptions.predefined = data.predefined.map((c) => ({id: c.id, text: c.text}));
        console.log('Updated secondaryOptions:', this.secondaryOptions);
        this.savedConditions = data.saved;
      }, error: (error) => console.error('Error fetching conditions:', error)
    });
  }

  loadAppliedConditions(): void {
    this.conditionService.fetchAppliedConditions(this.currentPdfId).subscribe({
      next: (conditions) => {
        this.conditions = conditions.map((condition: Condition) => ({
          id: condition.id, text: condition.text, visible: condition.visible ?? true
        }));
      }, error: (error) => console.error('Error fetching applied conditions:', error)
    });
  }

  loadAllPatterns(): void {
    this.patternService.fetchAllPatterns(this.currentPdfId).subscribe({
      next: (patterns) => {
        this.patterns = patterns.map(pattern => ({
          ...pattern, conditions: pattern.conditions.map((condition: Condition) => ({
            text: condition.text, visible: condition.visible ?? true
          }))
        }));
      }, error: (error) => console.error('Error fetching patterns:', error)
    });
  }

  analyzePdf(fileName: string): void {
    this.terminateAnalysis();

    this.displayMessage({
      message: 'Analysis has started. Please wait...', duration: 0
    });

    this.analysisSubscription = this.pdfAnalysisService.analyzePdfFromFirebase(fileName, this.conditions).subscribe({
      next: (response) => {
        if (Array.isArray(response) && response.length > 0 && response[0].choices && response[0].choices.length > 0 && response[0].choices[0].message) {
          this.analysisResponse = response[0].choices[0].message.content;
          this.displayMessage({
            message: 'Analysis completed successfully', duration: 3000
          });
        } else {
          this.analysisResponse = 'Received unexpected response structure from the analysis service';
          this.displayMessage({
            message: 'Unexpected response structure received', duration: 3000
          });
        }
      }, error: (error) => {
        console.error('Error analyzing PDF:', error);
        this.analysisResponse = 'Error analyzing PDF: ' + error.message;
        this.displayMessage({
          message: 'Analysis failed: ' + error.message, duration: 3000
        });
      }
    });
  }

  terminateAnalysis(): void {
    if (this.analysisSubscription) {
      this.analysisSubscription.unsubscribe();
      this.analysisSubscription = null;
      this.displayMessage({
        message: 'Analysis terminated by the user', duration: 3000
      });
    }
  }

  downloadAnalysisAsPDF(): void {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxTextWidth = pageWidth - margin * 2;

    const lines = doc.splitTextToSize(this.analysisResponse, maxTextWidth);

    let yPosition = 10;

    lines.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 10;
      }

      doc.text(line, margin, yPosition);
      yPosition += 10;
    });

    doc.save('analysisResponse.pdf');
  }

  openAnalysisAsPDF(): void {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 10;
    const bottomMargin = 10;

    const lines = doc.splitTextToSize(this.analysisResponse, maxLineWidth);

    let y = 10;
    for (let i = 0; i < lines.length; i++) {
      if (y > (doc.internal.pageSize.height || doc.internal.pageSize.getHeight()) - bottomMargin) {
        doc.addPage();
        y = 10;
      }
      doc.text(lines[i], margin, y);
      y += lineHeight;
    }

    const pdfBlob = doc.output('blob');
    const blobURL = URL.createObjectURL(pdfBlob);
    window.open(blobURL, '_blank');
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
      this.createCondition();
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
            id: selectedCondition.id, text: selectedCondition.text, visible: true
          });
          this.displayMessage({
            message: `Condition "${selectedCondition.text}" added successfully`, duration: 3000
          });
          console.log('Condition added:', selectedCondition);
        } else {
          this.displayMessage({
            message: 'No condition found with the provided ID', duration: 3000
          });
          console.warn('No condition found with ID:', conditionId);
        }
      } else {
        this.displayMessage({
          message: 'Condition already exists and cannot be added again', duration: 3000
        });
        console.warn('Condition already exists:', conditionId);
      }
    } else {
      this.displayMessage({
        message: 'Condition ID is required to add a condition', duration: 3000
      });
      console.error('Condition ID is required to add a condition');
    }
  }

  createCondition(): void {
    if (this.newConditionValue && !this.savedConditions.find(condition => condition.text === this.newConditionValue)) {
      this.conditionService.createCondition(this.newConditionValue, this.currentPdfId).subscribe({
        next: (response) => {
          const newCondition: Condition = {id: response.id, text: response.text, visible: true};
          this.savedConditions.push(newCondition);
          this.secondaryOptions['saved'] = this.savedConditions;
          this.newConditionValue = '';

          this.displayMessage({
            message: `Condition "${response.text}" saved successfully`, duration: 3000
          });
        }, error: (error) => {
          console.error('Failed to save condition:', error);
          this.displayMessage({
            message: `Failed to save condition: ${error.message}`, duration: 3000
          });
        }
      });
    } else if (this.newConditionValue) {
      this.displayMessage({
        message: `Condition "${this.newConditionValue}" already exists`, duration: 3000
      });
      console.warn('Condition is empty or already saved:', this.newConditionValue);
    } else {
      this.displayMessage({
        message: 'Please enter a condition to save', duration: 3000
      });
      console.warn('No condition entered');
    }
  }

  deleteCondition(conditionId: string): void {
    this.conditionService.removeConditionFromPdf(this.currentPdfId, conditionId).subscribe({
      next: (response) => {
        console.log('Condition removed:', response.message);
        this.loadAppliedConditions();
        this.displayMessage({
          message: 'Condition successfully removed from the PDF', duration: 3000
        });
      }, error: (error) => {
        console.error('Error removing condition:', error);
        this.displayMessage({
          message: `Failed to remove condition: ${error.message}`, duration: 3000
        });
      }
    });
  }

  saveConditionsForPdf(): void {
    const conditionIds = this.conditions
      .filter(condition => condition.id)
      .map(condition => condition.id);

    if (conditionIds.length > 0) {
      this.conditionService.applyConditionsToPdf(this.currentPdfId, conditionIds).subscribe({
        next: () => {
          console.log('Conditions saved successfully for PDF');
          this.displayMessage({
            message: 'Conditions applied successfully to the PDF', duration: 3000
          });
        }, error: (error) => {
          console.error('Error saving conditions for PDF:', error);
          this.displayMessage({
            message: `Failed to apply conditions to the PDF: ${error.message}`, duration: 3000
          });
        }
      });
    } else {
      this.displayMessage({
        message: 'No conditions selected to apply to the PDF', duration: 3000
      });
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
        this.displayMessage({
          message: 'Patterns applied successfully to the PDF', duration: 3000
        });
        this.conditions = [];
        response.appliedPatterns.forEach((pattern: any) => {
          pattern.conditions.forEach((condition: Condition) => {
            if (!this.conditions.some(c => c.id === condition.id)) {
              this.conditions.push({
                id: condition.id, text: condition.text, visible: true
              });
            }
          });
        });
        this.cdr.detectChanges();
        this.saveConditionsForPdf();
      }, error: (error) => {
        this.displayMessage({
          message: `Failed to apply pattern: ${error.message}`, duration: 3000
        });
      }
    });
  }

  deletePattern(patternId: string, patternIndex: number): void {
    this.patternService.deletePattern(patternId).subscribe({
      next: () => {
        this.patterns.splice(patternIndex, 1);
        this.displayMessage({
          message: 'Pattern deleted successfully', duration: 3000
        });
      }, error: (error) => {
        this.displayMessage({
          message: `Failed to delete pattern: ${error.message}`, duration: 3000
        });
      }
    });
  }

  addPattern(): void {
    const patternName = `pattern_${this.patterns.length + 1}`;
    const conditionIds = this.conditions.filter(c => c.id).map(c => c.id);

    const isDuplicate = this.patterns.some(pattern => pattern.conditions.length === conditionIds.length && pattern.conditions.every(pc => conditionIds.includes(pc.id)));

    if (!isDuplicate) {
      this.patternService.createPattern(patternName, conditionIds, this.currentPdfId).subscribe({
        next: (response) => {
          const createdPattern = {
            id: response.id,
            name: response.name,
            conditions: [...this.conditions.filter(c => conditionIds.includes(c.id))],
          };
          this.patterns.push(createdPattern);
          this.displayMessage({
            message: `Pattern "${response.name}" was created successfully`, duration: 3000
          });
        }, error: (error) => {
          console.error('Failed to create pattern:', error);
          this.displayMessage({
            message: 'Failed to create pattern. Please try again...', duration: 3000
          });
        }
      });
    } else {
      this.displayMessage({
        message: 'A pattern with the exact same conditions already exists', duration: 3000
      });
    }
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

  startEditPattern(patternIndex: number): void {
    this.editingPatternIndex = patternIndex;
    const pattern = this.patterns[patternIndex];
    this.displayMessage({
      message: `Edit the name of ${pattern.name}:`,
      duration: 0,
      showOptions: true,
      showInput: true,
      onYes: () => this.savePatternChanges(patternIndex),
      onNo: this.cancelEditing.bind(this)
    });
  }

  savePatternChanges(patternIndex: number): void {
    const newName = this.patternName.trim();
    if (newName && newName !== this.patterns[patternIndex].name) {
      const patternId = this.patterns[patternIndex].id;
      const pdfId = this.currentPdfId;

      this.patternService.editPattern(patternId, newName, pdfId).subscribe({
        next: () => {
          this.patterns[patternIndex].name = newName;

          this.displayMessage({
            message: 'Successfully! Pattern name updated', duration: 3000, showOptions: false, showInput: false
          });
        }, error: (error) => {
          console.error('Failed to update pattern name:', error.message);

          let errorMessage = 'Something went wrong, please try again...';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }

          this.displayMessage({
            message: errorMessage, duration: 3000, showOptions: false, showInput: false
          });
        }
      });
    }
    this.cancelEditing();
  }

  cancelEditing(): void {
    this.editingPatternIndex = null;
    this.patternName = '';
  }

  displayMessage({message, duration, showOptions = false, showInput = false, onYes, onNo}: {
    message: string, duration: number, showOptions?: boolean, showInput?: boolean, onYes?: () => void, onNo?: () => void
  }) {
    this.message = message;
    this.showMessage = true;
    this.showOptions = showOptions;
    this.showInput = showInput;

    this.onYesCallback = onYes;
    this.onNoCallback = onNo;

    if (duration > 0) {
      setTimeout(() => {
        this.showMessage = false;
        this.showOptions = false;
        this.showInput = false;
      }, duration);
    }
  }

  handleYes() {
    if (this.onYesCallback) this.onYesCallback();
    this.showMessage = false;
  }

  handleNo() {
    if (this.onNoCallback) this.onNoCallback();
    this.showMessage = false;
  }

  cancel(): void {
    this.showMessage = false;
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
