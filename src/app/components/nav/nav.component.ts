import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../shared/services/auth/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/landing']);
  }

  ngOnInit(): void {

  }

  get isProfilePage(): boolean {
    return this.router.url === '/profile';
  }

  get isDashboardPage(): boolean {
    return this.router.url === '/dashboard';
  }
}
