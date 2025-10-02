import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCount = 0;

  loading$: Observable<boolean> = this.loadingSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  setLoading(loading: boolean): void {
    if (loading) {
      this.loadingCount++;
    } else {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
    }

    // Only set loading to false when all operations are complete
    this.loadingSubject.next(this.loadingCount > 0);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  reset(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }
}