import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'sidebarCollapsed';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private collapsedSubject = new BehaviorSubject<boolean>(this.readStored());

  readonly collapsed$ = this.collapsedSubject.asObservable();

  constructor() {
    this.applySidebarWidth(this.collapsedSubject.value);
  }

  get collapsed(): boolean {
    return this.collapsedSubject.value;
  }

  toggle(): void {
    this.setCollapsed(!this.collapsedSubject.value);
  }

  setCollapsed(value: boolean): void {
    this.collapsedSubject.next(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* noop */
    }
    this.applySidebarWidth(value);
  }

  private readStored(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private applySidebarWidth(collapsed: boolean): void {
    const w = collapsed ? '72px' : '260px';
    document.documentElement.style.setProperty('--sidebar-width', w);
  }
}
