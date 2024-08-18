import { Injectable } from '@angular/core';
import { AppEventNames } from './app-event.model';
import { Observable, Subject } from 'rxjs';

export interface AppEvent {
  name: AppEventNames;
  data: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AppEventService {
  private appEvent$: Subject<AppEvent> = new Subject<AppEvent>();
  /**
   * It takes an event name and an optional event data object, and then it fires an event with that name and data
   *
   * @param name - The name of the event to fire.
   * @param data - any = {}
   */
  dispatchAppEvent(name: AppEventNames, data: unknown = {}): void {
    this.appEvent$.next({ name, data });
  }

  /**
   * This function returns an observable that emits app events.
   *
   * @returns An observable of AppEvent
   */
  listenToAppEvents(): Observable<AppEvent> {
    return this.appEvent$.asObservable();
  }
}
