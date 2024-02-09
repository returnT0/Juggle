import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { sendEmailVerification, reauthenticateWithCredential  } from '@angular/fire/auth';
import { CookieService } from 'ngx-cookie-service'; // Import CookieService

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: AngularFireAuth,
    private cookieService: CookieService
  ) { }

  getUserProfile() {
    return this.auth.authState;
  }

  signIn(params: SignIn): Observable<any> {
    return new Observable(observer => {
      this.auth.signInWithEmailAndPassword(params.email, params.password)
        .then(async (result) => {

          if (result.user) {
            if (!result.user.emailVerified) {
              observer.error('Please verify your email before signing in.');
            } else {

              const token = await result.user.getIdToken();
              this.cookieService.set('authToken', token);
              observer.next(result);
              observer.complete();
            }
          } else {
            observer.error('Sign-in was successful, but no user data is available.');
          }
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  async signUp(params: SignIn): Promise<Observable<any>> {
    try {
      const userCredentials = await this.auth.createUserWithEmailAndPassword(params.email, params.password);

      if (userCredentials.user) {
        await sendEmailVerification(userCredentials.user);
        const relevantUserData = {
          uid: userCredentials.user.uid,
          email: userCredentials.user.email,
          emailVerified: userCredentials.user.emailVerified,
        };
        return from(Promise.resolve(relevantUserData));
      } else {
        throw new Error('User creation failed or user is null');
      }
    } catch (error : any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('The email address is already in use by another account.');
      } else {
        throw new Error(error.message || 'Failed to sign up.');
      }
    }
  }

  signOut(): Observable<void> {
    this.cookieService.delete('authToken');
    return from(this.auth.signOut());
  }

  get isAuthenticated(): boolean {
    return this.cookieService.check('authToken');
  }

  async updateEmail(newEmail: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (user) {
      return user.updateEmail(newEmail)
        .then(() => {
          return user.sendEmailVerification();
        })
        .catch((error) => {
          throw error;
        });
    } else {
      throw new Error('No user logged in.');
    }
  }

  recoverPassword(email: string): Observable<void> {
    return from(this.auth.sendPasswordResetEmail(email));
  }
}

type SignIn = {
  email: string;
  password: string;
}
