import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private storage: AngularFireStorage) { }

  uploadFile(file: File) {
    const filePath = `pdfs/${new Date().getTime()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    // observe percentage changes
    task.percentageChanges().subscribe(percentage => {
      console.log(`Upload is ${percentage}% done`);
    });

    // get notified when the download URL is available
    task.snapshotChanges().pipe(
      finalize(() => fileRef.getDownloadURL().subscribe(url => {
        console.log(`Download URL: ${url}`);
        // Here you can add the URL to a database if required
      }))
    ).subscribe();
  }
  fetchAllPDFs(): Observable<string[]> {
    const ref = this.storage.storage.ref('pdfs'); // Adjust 'pdfs' if your folder structure is different
    return new Observable((observer) => {
      ref.listAll().then(result => {
        const urlPromises = result.items.map(item => item.getDownloadURL());
        Promise.all(urlPromises).then(urls => {
          observer.next(urls);
          observer.complete();
        }).catch(error => observer.error(error));
      }).catch(error => observer.error(error));
    });
  }
}
