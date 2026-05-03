class ReminderResponse {
  final int id;
  final int vehicleId;
  final String? vehicleInfo;
  final int? maintenanceId;
  final String title;
  final String? description;
  final String? reminderType;
  final int? thresholdMileage;
  final String? thresholdDate;
  final bool? isRecurring;
  final int? recurringInterval;
  final bool isActive;
  final String? createdAt;

  ReminderResponse({
    required this.id,
    required this.vehicleId,
    this.vehicleInfo,
    this.maintenanceId,
    required this.title,
    this.description,
    this.reminderType,
    this.thresholdMileage,
    this.thresholdDate,
    this.isRecurring,
    this.recurringInterval,
    required this.isActive,
    this.createdAt,
  });

  factory ReminderResponse.fromJson(Map<String, dynamic> json) =>
      ReminderResponse(
        id: json['id'] ?? 0,
        vehicleId: json['vehicleId'] ?? 0,
        vehicleInfo: json['vehicleInfo'],
        maintenanceId: json['maintenanceId'],
        title: json['title'] ?? '',
        description: json['description'],
        reminderType: json['reminderType'],
        thresholdMileage: json['thresholdMileage'],
        thresholdDate: json['thresholdDate'],
        isRecurring: json['isRecurring'],
        recurringInterval: json['recurringInterval'],
        isActive: json['isActive'] ?? true,
        createdAt: json['createdAt'],
      );
}
