class MaintenanceRequest {
  final int vehicleId;
  final String serviceType;
  final String? description;
  final int? mileageAtService;
  /// Si no se envía, el backend deduce según hay o no kilometraje.
  final String? odometerStatus;
  final String? serviceCategory;
  final double? cost;
  final String? serviceDate;
  final int? nextServiceMileage;
  final String? nextServiceDate;
  final String? workshopName;
  final String? workshopAddress;
  final String? status;
  final String? notes;

  MaintenanceRequest({
    required this.vehicleId,
    required this.serviceType,
    this.description,
    this.mileageAtService,
    this.odometerStatus,
    this.serviceCategory,
    this.cost,
    this.serviceDate,
    this.nextServiceMileage,
    this.nextServiceDate,
    this.workshopName,
    this.workshopAddress,
    this.status,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'vehicleId': vehicleId,
        'serviceType': serviceType,
        'description': description,
        'mileageAtService': mileageAtService,
        if (odometerStatus != null) 'odometerStatus': odometerStatus,
        'serviceCategory': serviceCategory ?? 'MIXED',
        'cost': cost,
        'serviceDate': serviceDate,
        'nextServiceMileage': nextServiceMileage,
        'nextServiceDate': nextServiceDate,
        'workshopName': workshopName,
        'workshopAddress': workshopAddress,
        'status': status,
        'notes': notes,
      };
}
