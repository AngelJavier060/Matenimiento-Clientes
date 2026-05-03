export interface MaintenanceResponse {
  id: number;
  vehicleId: number;
  vehicleInfo?: string;
  serviceType: string;
  description?: string;
  mileageAtService?: number;
  cost?: number;
  serviceDate?: string;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  workshopName?: string;
  workshopAddress?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}
