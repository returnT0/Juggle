import {Injectable} from '@angular/core';
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {catchError, lastValueFrom, Observable, throwError} from "rxjs";
import {finalize} from 'rxjs/operators';
import {PDFDocument} from 'pdf-lib';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(
    private storage: AngularFireStorage,
    private db: AngularFirestore,
    private http: HttpClient
  ) {
  }

  // async uploadFile(file: File | Blob, fileName: string): Promise<string> {
  //   const filePath = `pdfs/${new Date().getTime()}_${fileName}`;
  //   const fileRef = this.storage.ref(filePath);
  //   const task = this.storage.upload(filePath, file);
  //
  //   await lastValueFrom(task.percentageChanges()); // Wait for upload to complete
  //
  //   return new Promise((resolve, reject) => {
  //     task.snapshotChanges().pipe(finalize(async () => {
  //       const url = await fileRef.getDownloadURL().toPromise();
  //       console.log(`Download URL: ${url}`);
  //       resolve(url);
  //     })).subscribe();
  //   });
  // }

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

  // async uploadMergedPDF(files: File[], fileName: string): Promise<void> {
  //   const formData = new FormData();
  //   files.forEach(file => formData.append('files', file));
  //   formData.append('fileName', fileName);
  //
  //   await this.http.post('/api/merge-upload-pdfs', formData).toPromise();
  // }

  async mergePDFFiles(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    return mergedPdf.save();
  }

  async uploadMergedPDF(files: File[], fileName: string): Promise<void> {
    const mergedPdfFile = await this.mergePDFFiles(files);
    const fileBlob = new Blob([mergedPdfFile], {type: 'application/pdf'});
    await this.uploadFile(fileBlob, fileName); // Ensure this awaits the uploadFile's completion
  }

  // fetchAllPDFs(): Observable<{ id: string, url: string, path: string }[]> {
  //   const ref = this.storage.storage.ref('pdfs');
  //   return new Observable((observer) => {
  //     ref.listAll().then(result => {
  //       const metadataPromises = result.items.map(item => item.getDownloadURL().then(url => ({
  //         id: item.name,
  //         url,
  //         path: item.fullPath
  //       })));
  //       Promise.all(metadataPromises).then(files => {
  //         observer.next(files);
  //         observer.complete();
  //       }).catch(error => observer.error(error));
  //     }).catch(error => observer.error(error));
  //   });
  // }

  fetchAllPDFs(): Observable<{ id: string, url: string, path: string }[]> {
    return this.http.get<{ id: string, url: string, path: string }[]>('/api/fetch-all-pdfs');
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
