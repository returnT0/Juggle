import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  message: string = '';
  showMessage: boolean = false;
  showOptions!: boolean;

  gridItems: GridItem[] = [
    {
      id: 1,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
    {
      id: 2,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
    {
      id: 3,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
    {
      id: 4,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
    {
      id: 5,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
    {
      id: 6,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
    {
      id: 7,
      title: 'Noteworthy technology acquisitions 2021',
      description: 'Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.',
      link: '#'
    },
  ];

  constructor() {
  }

  ngOnInit(): void {
  }

  deleteItem(itemId: number): void {
    const item = this.gridItems.find(item => item.id === itemId);
    if (item) {
      this.displayMessage({
        message: `DO YOU WANT TO DELETE '${item.title}' FROM THE LIST?`,
        duration: 60000,
        showOptions: true,
        onYes: () => {
          try {
            this.gridItems = this.gridItems.filter(item => item.id !== itemId);
            this.displayMessage({
              message: `'${item.title}' DELETED.`,
              duration: 5000
            });
          } catch (error) {
            this.displayMessage({
              message: `FAILED TO DELETE '${item.title}'. PLEASE TRY AGAIN.`,
              duration: 5000
            });
          }
        },
        onNo: () => {
          console.log('Deletion cancelled.');
        }
      });
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
