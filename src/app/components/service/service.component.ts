import { Component } from '@angular/core';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrl: './service.component.css'
})
export class ServiceComponent {
  allowNewSignups = false;

  toggleSignupMessage(): void {
    this.allowNewSignups = true;
  }
}
