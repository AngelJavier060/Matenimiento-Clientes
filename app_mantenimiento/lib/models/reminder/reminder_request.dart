class ReminderRequest {
  final int vehicleId;
  final int? maintenanceId;
  final String title;
  final String? description;
  final String? reminderType;
  final int? thresholdMileage;
  final String? thresholdDate;
  final bool? isRecurring;
  final int? recurringInterval;

  ReminderRequest({
    required this.vehicleId,
    this.maintenanceId,
    required this.title,
    this.description,
    this.reminderType,
    this.thresholdMileage,
    this.thresholdDate,
    this.isRecurring,
    this.recurringInterval,
  });

  Map<String, dynamic> toJson() => {
        'vehicleId': vehicleId,
        'maintenanceId': maintenanceId,
        'title': title,
        'description': description,
        'reminderType': reminderType,
        'thresholdMileage': thresholdMileage,
        'thresholdDate': thresholdDate,
        'isRecurring': isRecurring,
        'recurringInterval': recurringInterval,
      };
}
