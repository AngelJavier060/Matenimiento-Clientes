import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReminderResponse } from '../../models/reminder/reminder-response';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserReminders(): Observable<ReminderResponse[]> {
    return this.http.get<ReminderResponse[]>(`${this.apiUrl}/reminders`);
  }

  getDueReminders(): Observable<ReminderResponse[]> {
    return this.http.get<ReminderResponse[]>(`${this.apiUrl}/reminders/due`);
  }

  getRemindersByVehicle(vehicleId: number): Observable<ReminderResponse[]> {
    return this.http.get<ReminderResponse[]>(
      `${this.apiUrl}/reminders/vehicle/${vehicleId}`
    );
  }

  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reminders/${id}`);
  }
}
