import {Injectable} from '@angular/core';
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {lastValueFrom, Observable} from "rxjs";
import {finalize} from 'rxjs/operators';
import {PDFDocument} from 'pdf-lib';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private storage: AngularFireStorage) {
  }

  async uploadFile(file: File | Blob, fileName: string): Promise<string> {
    const filePath = `pdfs/${new Date().getTime()}_${fileName}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    await lastValueFrom(task.percentageChanges()); // Wait for upload to complete

    return new Promise((resolve, reject) => {
      task.snapshotChanges().pipe(finalize(async () => {
        const url = await fileRef.getDownloadURL().toPromise();
        console.log(`Download URL: ${url}`);
        resolve(url);
      })).subscribe();
    });
  }

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

  fetchAllPDFs(): Observable<{ url: string, path: string }[]> {
    const ref = this.storage.storage.ref('pdfs');
    return new Observable((observer) => {
      ref.listAll().then(result => {
        const metadataPromises = result.items.map(item => item.getDownloadURL().then(url => ({
          url, path: item.fullPath // Get the full path of the file
        })));
        Promise.all(metadataPromises).then(files => {
          observer.next(files);
          observer.complete();
        }).catch(error => observer.error(error));
      }).catch(error => observer.error(error));
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Use ref() with a child path
      const fileRef = this.storage.ref(filePath);
      await fileRef.delete();
      console.log("File successfully deleted");
    } catch (error) {
      console.error("Error while deleting file:", error);
      throw error; // Rethrow or handle as needed
    }
  }

}
