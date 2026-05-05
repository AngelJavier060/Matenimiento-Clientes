/** Coincide con backend MaintenanceLineType y MaintenanceLineResponse */
export type MaintenanceLineType = 'RECOMMENDED' | 'PERFORMED' | 'SYMPTOM';

export interface MaintenanceLineItem {
  id: number;
  lineType: MaintenanceLineType | string;
  description: string;
  done?: boolean;
  includedInRecord?: boolean;
  sortOrder?: number;
}

export interface MaintenanceResponse {
  id: number;
  vehicleId: number;
  vehicleInfo?: string;
  serviceType: string;
  description?: string;
  mileageAtService?: number;
  odometerStatus?: string;
  serviceCategory?: string;
  cost?: number;
  serviceDate?: string;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  workshopName?: string;
  workshopAddress?: string;
  status?: string;
  notes?: string;
  lineItems?: MaintenanceLineItem[];
  createdAt?: string;
}
