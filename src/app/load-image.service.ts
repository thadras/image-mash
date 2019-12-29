import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class LoadImageService {

  constructor(private httpClient: HttpClient) { }

  getImage(imageUrl: string): Observable<Blob> {
    console.log('service says: %s', imageUrl)
    return this.httpClient.get(imageUrl, { responseType: 'blob' });
  }

}
