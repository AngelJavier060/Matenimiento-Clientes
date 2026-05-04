import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { VehicleResponse } from '../../models/vehicle/vehicle-response';
import { VehicleRequest } from '../../models/vehicle/vehicle-request';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/vehicles`).pipe(
      map(vehicles => vehicles.map(v => this.fixImageUrl(v)))
    );
  }

  getVehicleById(id: number): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.apiUrl}/vehicles/${id}`).pipe(
      map(v => this.fixImageUrl(v))
    );
  }

  createVehicle(data: VehicleRequest): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(`${this.apiUrl}/vehicles`, data).pipe(
      map(v => this.fixImageUrl(v))
    );
  }

  updateVehicle(id: number, data: VehicleRequest): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${this.apiUrl}/vehicles/${id}`, data).pipe(
      map(v => this.fixImageUrl(v))
    );
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicles/${id}`);
  }

  getVehiclesByClient(clientId: number): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/vehicles/by-client/${clientId}`).pipe(
      map(vehicles => vehicles.map(v => this.fixImageUrl(v)))
    );
  }

  uploadVehiclePhoto(vehicleId: number, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleId', String(vehicleId));
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/upload/vehicle-photo`, formData);
  }

  /** Convierte rutas relativas de imágenes a URLs completas */
  private fixImageUrl(v: VehicleResponse): VehicleResponse {
    if (v.imageUrl && v.imageUrl.startsWith('/')) {
      v.imageUrl = environment.apiUrl.replace('/api', '') + v.imageUrl;
    }
    return v;
  }
}
