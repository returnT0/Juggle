import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {PdfViewerModule} from "ng2-pdf-viewer";
import {AngularFireModule} from "@angular/fire/compat";
import {environment} from "../environments/environment";
import {AngularFireAuthModule} from "@angular/fire/compat/auth";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { NavComponent } from './nav/nav.component';
import { LandingComponent } from './landing/landing.component';
import { FooterComponent } from './footer/footer.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './not-found/not-found.component';
import {AngularFireStorage} from "@angular/fire/compat/storage/storage";
import {AngularFireStorageModule} from "@angular/fire/compat/storage";
import {AngularFirestoreModule} from "@angular/fire/compat/firestore";
import { PdfviewerComponent } from './pdfviewer/pdfviewer.component';
import { HttpClientModule} from "@angular/common/http";

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    LandingComponent,
    FooterComponent,
    SignUpComponent,
    SignInComponent,
    ProfileComponent,
    DashboardComponent,
    NotFoundComponent,
    PdfviewerComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,

        AngularFireModule.initializeApp(environment.firebase),
        AngularFireAuthModule,
        ReactiveFormsModule,
        PdfViewerModule,
        AngularFireStorageModule,
        AngularFirestoreModule,
        FormsModule,
        HttpClientModule,
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
