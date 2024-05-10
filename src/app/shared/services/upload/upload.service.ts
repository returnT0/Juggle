import {Injectable} from '@angular/core';
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {catchError, lastValueFrom, Observable, throwError} from "rxjs";
import {switchMap} from 'rxjs/operators';
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

  fetchAllPDFs(): Observable<PdfData[]> {
    return this.afAuth.idToken.pipe(
      switchMap(token => {
        const headers = { 'Authorization': `Bearer ${token}` };
        return this.http.get<PdfData[]>('/api/fetch-all-pdfs', { headers });
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

}

interface PdfData {
  id: string;
  url: string;
  path: string;
}
