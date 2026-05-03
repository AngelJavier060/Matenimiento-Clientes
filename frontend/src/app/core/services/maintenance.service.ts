import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenanceResponse } from '../../models/maintenance/maintenance-response';
import { MaintenanceRequest } from '../../models/maintenance/maintenance-request';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMaintenancesByVehicle(vehicleId: number): Observable<MaintenanceResponse[]> {
    return this.http.get<MaintenanceResponse[]>(
      `${this.apiUrl}/maintenance/vehicle/${vehicleId}`
    );
  }

  createMaintenance(data: MaintenanceRequest): Observable<MaintenanceResponse> {
    return this.http.post<MaintenanceResponse>(`${this.apiUrl}/maintenance`, data);
  }

  updateMaintenance(id: number, data: MaintenanceRequest): Observable<MaintenanceResponse> {
    return this.http.put<MaintenanceResponse>(
      `${this.apiUrl}/maintenance/${id}`, data
    );
  }

  deleteMaintenance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/maintenance/${id}`);
  }
}
