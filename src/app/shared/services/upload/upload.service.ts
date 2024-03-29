import {Injectable} from '@angular/core';
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {catchError, lastValueFrom, Observable, throwError} from "rxjs";
import {finalize, switchMap} from 'rxjs/operators';
import {PDFDocument} from 'pdf-lib';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {HttpClient} from "@angular/common/http";
import {AngularFireAuth} from "@angular/fire/compat/auth";

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(
    private storage: AngularFireStorage,
    private db: AngularFirestore,
    private http: HttpClient,
    private afAuth: AngularFireAuth
  ) {
  }

  async uploadFile(file: File | Blob, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    return this.http.post<{ url: string }>('/api/upload-file', formData)
      .pipe(
        catchError(error => throwError(() => new Error(`Failed to upload file: ${error.message}`)))
      )
      .toPromise()
      .then(response => {
        if (!response || !response.url) {
          throw new Error('Upload did not return a valid URL.');
        }
        return response.url;
      });
  }

  async uploadMergedPDF(files: File[], fileName: string): Promise<void> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('fileName', fileName);

    await this.http.post('/api/merge-upload-pdfs', formData).toPromise();
  }

  fetchAllPDFs(): Observable<{ id: string, url: string, path: string }[]> {
    return this.afAuth.idToken.pipe(
      switchMap(token => {
        const headers = { 'Authorization': `Bearer ${token}` };
        return this.http.get<{ id: string, url: string, path: string }[]>('/api/fetch-all-pdfs', { headers });
      }),
      catchError(error => {
        console.error('Error fetching PDFs:', error);
        return throwError(error);
      })
    );
  }

  async getPDFUrlById(pdfId: string): Promise<string> {
    try {
      const fileRef = this.storage.ref(`${pdfId}`);
      return await fileRef.getDownloadURL().toPromise();
    } catch (error) {
      console.error("Error fetching PDF URL by ID:", error);
      throw new Error("Could not fetch PDF URL.");
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.http.delete('/api/delete-pdf', { body: { filePath } }).toPromise();
      console.log("File successfully deleted");
    } catch (error) {
      console.error("Error while deleting file:", error);
      throw error;
    }
  }

  fetchConditionsByPdfId(pdfId: string): Observable<any[]> {
    return this.db.collection('conditions', ref => ref.where('pdfId', '==', pdfId)).valueChanges();
  }

  saveCondition(pdfId: string, condition: { text: string; visible: boolean }): Promise<void> {
    return this.db.collection('conditions').add({ ...condition, pdfId })
      .then(() => {}) // Explicitly resolve to void
      .catch(error => {
        console.error("Error saving condition:", error);
        throw new Error("Failed to save condition.");
      });
  }


  deleteCondition(conditionId: string): Promise<void> {
    return this.db.collection('conditions').doc(conditionId).delete();
  }

  savePattern(pdfId: string, pattern: { name: string; conditions: { text: string; visible: boolean }[] }): Promise<void> {
    return this.db.collection('patterns').add({ ...pattern, pdfId })
      .then(() => {}) // Explicitly resolve to void
      .catch(error => {
        console.error("Error saving pattern:", error);
        throw new Error("Failed to save pattern.");
      });
  }

  deletePattern(patternId: string): Promise<void> {
    return this.db.collection('patterns').doc(patternId).delete();
  }


}
