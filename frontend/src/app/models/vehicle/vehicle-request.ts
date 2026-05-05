export interface VehicleRequest {
  brand: string;
  model: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  imageUrl?: string;
  clientId?: number;
  notes?: string;
  /** Plan MP fijo; omitir o null = automático por MMY */
  maintenancePlanId?: number | null;
  nextCommittedServiceMileage?: number | null;
  /** ISO yyyy-mm-dd */
  nextCommittedServiceDate?: string | null;
}
