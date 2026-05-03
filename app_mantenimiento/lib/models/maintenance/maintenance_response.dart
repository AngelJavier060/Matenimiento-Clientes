class MaintenanceResponse {
  final int id;
  final int vehicleId;
  final String? vehicleInfo;
  final String serviceType;
  final String? description;
  final int? mileageAtService;
  final double? cost;
  final String? serviceDate;
  final int? nextServiceMileage;
  final String? nextServiceDate;
  final String? workshopName;
  final String? workshopAddress;
  final String? status;
  final String? notes;
  final String? createdAt;

  MaintenanceResponse({
    required this.id,
    required this.vehicleId,
    this.vehicleInfo,
    required this.serviceType,
    this.description,
    this.mileageAtService,
    this.cost,
    this.serviceDate,
    this.nextServiceMileage,
    this.nextServiceDate,
    this.workshopName,
    this.workshopAddress,
    this.status,
    this.notes,
    this.createdAt,
  });

  factory MaintenanceResponse.fromJson(Map<String, dynamic> json) =>
      MaintenanceResponse(
        id: json['id'] ?? 0,
        vehicleId: json['vehicleId'] ?? 0,
        vehicleInfo: json['vehicleInfo'],
        serviceType: json['serviceType'] ?? '',
        description: json['description'],
        mileageAtService: json['mileageAtService'],
        cost: (json['cost'] as num?)?.toDouble(),
        serviceDate: json['serviceDate'],
        nextServiceMileage: json['nextServiceMileage'],
        nextServiceDate: json['nextServiceDate'],
        workshopName: json['workshopName'],
        workshopAddress: json['workshopAddress'],
        status: json['status'],
        notes: json['notes'],
        createdAt: json['createdAt'],
      );

  String get statusDisplay {
    switch (status) {
      case 'SCHEDULED':
        return 'Programado';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status ?? 'Desconocido';
    }
  }
}
