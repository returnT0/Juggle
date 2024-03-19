import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../shared/auth-service/auth.service";
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

  signOut(): void {
    this.authService.signOut();
    this.router.navigate(['/landing']);
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
