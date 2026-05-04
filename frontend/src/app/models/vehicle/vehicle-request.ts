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
}
