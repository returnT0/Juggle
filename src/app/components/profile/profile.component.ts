import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../shared/services/auth-service/auth.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  emailUpdateForm: FormGroup;
  message: string = '';
  showMessage: boolean = false;
  showOptions!: boolean;

  constructor(
    private authService: AuthService
  ) {
    this.emailUpdateForm = new FormGroup({
      newEmail: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  ngOnInit(): void {
    this.authService.getUserProfile().subscribe(user => {
      if (user) {
        this.user = user;
      } else {
        this.user = null;
      }
    });
  }

  copyEmailToClipboard(email: string): void {
    navigator.clipboard.writeText(email).
    then(() => {
      this.displayMessage({message: 'EMAIL COPIED TO CLIPBOARD.', duration: 3000});
    }).
    catch(() => {
      this.displayMessage({message: 'SOMETHING WENT WRONG.', duration: 3000});
    });
  }

  updateEmail(): void {
    if (this.emailUpdateForm.valid) {
      const newEmail = this.emailUpdateForm.get('newEmail')?.value;
      this.authService.updateEmail(newEmail)
        .then(() => {
          alert('Email updated successfully. Please verify your new email.');
        })
        .catch(error => {
          console.error('Error updating email:', error);
          alert('Failed to update email. ' + error.message);
        });
    } else {
      alert('Please enter a valid email address.');
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

  recoverPassword(): void {
    this.displayMessage({
      message: 'WANT TO RESET CURRENT PASSWORD?',
      duration: 60000,
      showOptions: true,
      onYes: () => this.authService.recoverPassword(this.user.email)
        .subscribe(() => {
          this.displayMessage({
            message: 'PASSWORD RESET SUCCESSFULLY. PLEASE CHECK YOUR EMAIL.',
            duration: 5000
          });
        }, (error) => {
          this.displayMessage({
            message: 'FAILED TO RESET CURRENT PASSWORD. PLEASE TRY AGAIN.',
            duration: 5000
          });
        }),
      onNo: () => {
        console.log('User chose not to reset password.');
      }
    });
  }

  cancel(): void {
    this.showMessage = false
  }

}
