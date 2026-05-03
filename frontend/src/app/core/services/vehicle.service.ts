import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VehicleResponse } from '../../models/vehicle/vehicle-response';
import { VehicleRequest } from '../../models/vehicle/vehicle-request';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/vehicles`);
  }

  getVehicleById(id: number): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.apiUrl}/vehicles/${id}`);
  }

  createVehicle(data: VehicleRequest): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(`${this.apiUrl}/vehicles`, data);
  }

  updateVehicle(id: number, data: VehicleRequest): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${this.apiUrl}/vehicles/${id}`, data);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicles/${id}`);
  }
}
