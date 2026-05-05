export interface VehicleResponse {
  id: number;
  brand: string;
  model: string;
  year: number;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  imageUrl?: string;
  clientId?: number;
  clientName?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  maintenanceCount: number;
  maintenancePlanId?: number | null;
  /** Próximo servicio pactado por unidad (opcional km y/o fecha). */
  nextCommittedServiceMileage?: number | null;
  nextCommittedServiceDate?: string | null;
}
