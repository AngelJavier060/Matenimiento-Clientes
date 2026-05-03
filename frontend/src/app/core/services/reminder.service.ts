import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReminderResponse } from '../../models/reminder/reminder-response';
import { ReminderRequest } from '../../models/reminder/reminder-request';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRemindersByVehicle(vehicleId: number): Observable<ReminderResponse[]> {
    return this.http.get<ReminderResponse[]>(
      `${this.apiUrl}/reminders/vehicle/${vehicleId}`
    );
  }

  createReminder(data: ReminderRequest): Observable<ReminderResponse> {
    return this.http.post<ReminderResponse>(`${this.apiUrl}/reminders`, data);
  }

  updateReminder(id: number, data: ReminderRequest): Observable<ReminderResponse> {
    return this.http.put<ReminderResponse>(
      `${this.apiUrl}/reminders/${id}`, data
    );
  }

  deleteReminder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reminders/${id}`);
  }
}
