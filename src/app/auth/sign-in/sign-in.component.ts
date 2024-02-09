import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {AuthService} from "../services/auth.service";

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {

  form!: FormGroup;
  message: string = '';
  showMessage: boolean = false;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  signIn() {
    this.authService.signIn({
      email: this.form.value.email,
      password: this.form.value.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        if (error === 'Please verify your email before signing in.') {
          this.displayMessage({
            message: 'YOUR EMAIL ADDRESS HAS NOT BEEN VERIFIED. PLEASE CHECK YOUR INBOX OR SPAM FOLDER FOR THE VERIFICATION EMAIL.',
            duration: 7000
          });
        } else {
          console.error(error);
          this.displayMessage({
            message: 'FAILED TO SIGN IN. PLEASE CHECK YOUR CREDENTIALS AND TRY AGAIN.',
            duration: 5000
          });
        }
      }
    });
  }

  displayMessage({message, duration}: { message: any, duration: any }) {
    this.message = message;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, duration);
  }


  recoverPassword() {

    this.authService.recoverPassword(
      this.form.value.email
    ).subscribe(
      () => {
        this.message = 'YOU CAN RECOVER YOUR PASSWORD IN YOUR EMAIL ACCOUNT.';
        this.showMessage = true;
        setTimeout(() => {
          this.showMessage = false;
        }, 5000);
      },
      (error: any) => {
        this.message = 'FAILED TO RECOVER PASSWORD, TRY AGAIN LATER.';
        this.showMessage = true;
        setTimeout(() => {
          this.showMessage = false;
        }, 5000);
        console.error(error)
      }
    );
  }

  cancel(): void {
    this.showMessage = false
  }
}
