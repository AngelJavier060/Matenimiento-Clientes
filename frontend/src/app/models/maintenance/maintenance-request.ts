/** Coincide con backend OdometerStatus */
export type OdometerStatus = 'KNOWN' | 'UNKNOWN' | 'ESTIMATED';

/** Coincide con backend ServiceCategory */
export type ServiceCategory = 'PREVENTIVE' | 'CORRECTIVE' | 'MIXED';

/** Coincide con backend MaintenanceLineType */
export type MaintenanceLineType = 'RECOMMENDED' | 'PERFORMED' | 'SYMPTOM';

export interface MaintenanceLinePayload {
  id?: number;
  lineType: MaintenanceLineType;
  description: string;
  done?: boolean;
  includedInRecord?: boolean;
  sortOrder?: number;
}

export interface MaintenanceRequest {
  vehicleId: number;
  serviceType: string;
  description?: string;
  mileageAtService?: number;
  odometerStatus?: OdometerStatus;
  serviceCategory?: ServiceCategory;
  cost?: number;
  serviceDate?: string;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  workshopName?: string;
  workshopAddress?: string;
  status?: string;
  notes?: string;
  lineItems?: MaintenanceLinePayload[];
}
