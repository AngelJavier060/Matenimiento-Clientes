export interface ReminderResponse {
  id: number;
  vehicleId: number;
  vehicleInfo?: string;
  maintenanceId?: number;
  title: string;
  description?: string;
  reminderType?: string;
  thresholdMileage?: number;
  thresholdDate?: string;
  isRecurring?: boolean;
  recurringInterval?: number;
  isActive: boolean;
  createdAt?: string;
}
