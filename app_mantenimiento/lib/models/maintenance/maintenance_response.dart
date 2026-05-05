import 'maintenance_line_item.dart';

class MaintenanceResponse {
  final int id;
  final int vehicleId;
  final String? vehicleInfo;
  final String serviceType;
  final String? description;
  final int? mileageAtService;
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
  final String? createdAt;
  final List<MaintenanceLineItem>? lineItems;

  MaintenanceResponse({
    required this.id,
    required this.vehicleId,
    this.vehicleInfo,
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
    this.createdAt,
    this.lineItems,
  });

  factory MaintenanceResponse.fromJson(Map<String, dynamic> json) {
    List<MaintenanceLineItem>? lines;
    final raw = json['lineItems'];
    if (raw is List) {
      lines = raw
          .whereType<Map>()
          .map((e) =>
              MaintenanceLineItem.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return MaintenanceResponse(
      id: (json['id'] as num?)?.toInt() ?? 0,
      vehicleId: (json['vehicleId'] as num?)?.toInt() ?? 0,
      vehicleInfo: json['vehicleInfo']?.toString(),
      serviceType: json['serviceType']?.toString() ?? '',
      description: json['description']?.toString(),
      mileageAtService: (json['mileageAtService'] as num?)?.toInt(),
      odometerStatus: json['odometerStatus']?.toString(),
      serviceCategory: json['serviceCategory']?.toString(),
      cost: (json['cost'] as num?)?.toDouble(),
      serviceDate: json['serviceDate']?.toString(),
      nextServiceMileage:
          (json['nextServiceMileage'] as num?)?.toInt(),
      nextServiceDate: json['nextServiceDate']?.toString(),
      workshopName: json['workshopName']?.toString(),
      workshopAddress: json['workshopAddress']?.toString(),
      status: json['status']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['createdAt']?.toString(),
      lineItems: lines?.isEmpty == true ? null : lines,
    );
  }

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
