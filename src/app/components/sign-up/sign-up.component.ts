import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../../shared/services/auth/auth.service";
import {Router} from "@angular/router";
import {from} from "rxjs";

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit {

  form!: FormGroup;
  message: string = '';
  showMessage: boolean = false;
  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async signUp() {
    if (!this.form.valid) {
      this.displayMessage({message: 'PLEASE CHECK YOUR INPUT AND TRY AGAIN.', duration: 10000});
      return;
    }
    try {
      await this.authService.signUp({
        email: this.form.value.email,
        password: this.form.value.password
      });
      this.displayMessage({message: 'CHECK YOUR EMAIL TO VERIFY YOUR ACCOUNT.', duration: 10000});
      setTimeout(() => {
        this.router.navigate(['/sign-in']);
      }, 10000);
    }
    catch (error: any) {
      console.error('Full error object:', error);

      if (error.message && error.message.toLowerCase().includes('email address is already in use')) {
        this.displayMessage({message: 'THE EMAIL ADDRESS IS ALREADY IN USE BY ANOTHER ACCOUNT.', duration: 5000});
      } else {
        this.displayMessage({message: 'SOMETHING WENT WRONG, TRY AGAIN LATER.', duration: 5000});
      }
    }
  }

  displayMessage({message, duration}: { message: any, duration: any }) {
    this.message = message;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, duration);
  }


  cancel(): void {
    this.showMessage = false
  }
}
