import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UploadService } from '../shared/upload.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.css'],
})
export class PdfviewerComponent implements OnInit, OnDestroy {
  pdfSrc: string = '';
  conditions: { text: string; visible: boolean }[] = [];
  showOverlay = true;
  showPattern = true;
  patterns: { name: string; conditions: { text: string; visible: boolean }[] }[] = [
    {
      name: 'pattern_1',
      conditions: [
        { text: 'Condition 1', visible: true },
        { text: 'Condition 2', visible: false },
      ],
    },
    {
      name: 'pattern_2',
      conditions: [
        { text: 'Condition 3', visible: true },
        { text: 'Condition 4', visible: true },
      ],
    },
    {
      name: 'pattern_3',
      conditions: [
        { text: 'Condition 5', visible: true },
        { text: 'Condition 6', visible: false },
      ],
    },
    {
      name: 'pattern_4',
      conditions: [
        { text: 'Condition 2', visible: true },
        { text: 'Condition 4', visible: false },
      ],
    },
    {
      name: 'pattern_5',
      conditions: [
        { text: 'Condition 1', visible: true },
        { text: 'Condition 7', visible: false },
      ],
    },
  ];
  appliedPatterns: number[] = [];
  editingPatternIndex: number | null = null;
  savedConditions: string[] = [];
  selectedCondition: string = 'makeYourOwn';
  newConditionValue: string = '';
  secondaryOptions: { [key: string]: string[] } = {
    textPatternExtraction: [
      'Extract email addresses',
      'Extract phone numbers',
      'Extract data',
      'Detect and Extract Financial Data',
    ],
    extractStructuredData: [
      'Extract data from form fields',
      'Extract list items (bullets/numbers)',
      'Extract highlighted or annotated text',
    ],
    Saved: this.savedConditions,
  };
  secondarySelection: string = '';

  private routeSub: Subscription | undefined;

  constructor(private route: ActivatedRoute, private uploadService: UploadService) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe((params) => {
      const pdfId = params['id'];
      this.fetchPdfUrlById(pdfId);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private fetchPdfUrlById(pdfId: string): void {
    this.uploadService
      .getPDFUrlById(pdfId)
      .then((url) => {
        this.pdfSrc = url;
      })
      .catch((error) => console.error(error));
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
      this.conditions.push({ text: conditionValue, visible: true });
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

  applyPatternConditions(patternIndex: number): void {
    const patternConditions = this.patterns[patternIndex].conditions;
    patternConditions.forEach(pc => {
      if (!this.conditions.some(c => c.text === pc.text)) {
        this.conditions.push({ ...pc });
      }
    });
  }

  editPatternName(patternIndex: number, newName: string): void {
    if (newName.trim().length === 0) {
      alert('Pattern name cannot be empty.');
      return;
    }

    this.patterns[patternIndex].name = newName;
  }

  startEditingPattern(patternIndex: number): void {
    this.editingPatternIndex = patternIndex;
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
          this.conditions.push({ ...pc });
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
      name: patternName,
      conditions: [...this.conditions],
    };

    const isDuplicate = this.patterns.some(pattern =>
      pattern.conditions.length === newPattern.conditions.length &&
      pattern.conditions.every(pc => newPattern.conditions.some(nc => nc.text === pc.text))
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
}
