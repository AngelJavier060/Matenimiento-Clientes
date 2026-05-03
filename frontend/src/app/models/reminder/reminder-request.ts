export interface ReminderRequest {
  vehicleId: number;
  maintenanceId?: number;
  title: string;
  description?: string;
  reminderType?: string;
  thresholdMileage?: number;
  thresholdDate?: string;
  isRecurring?: boolean;
  recurringInterval?: number;
}
