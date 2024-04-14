import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LandingComponent} from "./components/landing/landing.component";
import {SignInComponent} from "./components/sign-in/sign-in.component";
import {SignUpComponent} from "./components/sign-up/sign-up.component";
import {NotFoundComponent} from "./components/not-found/not-found.component";
import {DashboardComponent} from "./components/dashboard/dashboard.component";
import {AuthGuard} from "./guards/auth.guard";
import {ProfileComponent} from "./components/profile/profile.component";
import {PdfviewerComponent} from "./components/pdfviewer/pdfviewer.component";
import {AboutComponent} from "./components/about/about.component";
import {ServiceComponent} from "./components/service/service.component";

const routes: Routes = [
  {path: '', redirectTo: '/landing', pathMatch: 'full'},
  {path: 'landing', component: LandingComponent},
  {path: 'sign-in', component: SignInComponent},
  {path: 'sign-up', component: SignUpComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuard]},
  {path: 'view-pdf/:id', component: PdfviewerComponent , canActivate: [AuthGuard]},
  {path: 'about', component: AboutComponent},
  {path: 'services', component: ServiceComponent},
  {path: '**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
