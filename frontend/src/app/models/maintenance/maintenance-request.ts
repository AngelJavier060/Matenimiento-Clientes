export interface MaintenanceRequest {
  vehicleId: number;
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
}
