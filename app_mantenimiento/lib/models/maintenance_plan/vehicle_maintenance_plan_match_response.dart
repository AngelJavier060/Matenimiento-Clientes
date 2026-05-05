import 'maintenance_plan_response.dart';

class VehicleMaintenancePlanMatchResponse {
  final int vehicleId;
  final String? vehicleBrand;
  final String? vehicleModel;
  final int? vehicleYear;
  final int? vehicleMileage;
  final String? licensePlate;
  final String matchMode;
  final int? resolvedPlanId;
  final MaintenancePlanResponse? plan;
  final String? hint;
  final int? lastServiceMileage;
  final String? lastServiceDate;
  final int? nextCommittedServiceMileage;
  final String? nextCommittedServiceDate;

  VehicleMaintenancePlanMatchResponse({
    required this.vehicleId,
    this.vehicleBrand,
    this.vehicleModel,
    this.vehicleYear,
    this.vehicleMileage,
    this.licensePlate,
    this.matchMode = 'NONE',
    this.resolvedPlanId,
    this.plan,
    this.hint,
    this.lastServiceMileage,
    this.lastServiceDate,
    this.nextCommittedServiceMileage,
    this.nextCommittedServiceDate,
  });

  factory VehicleMaintenancePlanMatchResponse.fromJson(
      Map<String, dynamic> json) {
    MaintenancePlanResponse? p;
    if (json['plan'] != null &&
        json['plan'] is Map<String, dynamic>) {
      p = MaintenancePlanResponse.fromJson(
          Map<String, dynamic>.from(json['plan'] as Map));
    }

    return VehicleMaintenancePlanMatchResponse(
      vehicleId: (json['vehicleId'] as num?)?.toInt() ?? 0,
      vehicleBrand: json['vehicleBrand']?.toString(),
      vehicleModel: json['vehicleModel']?.toString(),
      vehicleYear: (json['vehicleYear'] as num?)?.toInt(),
      vehicleMileage: (json['vehicleMileage'] as num?)?.toInt(),
      licensePlate: json['licensePlate']?.toString(),
      matchMode: json['matchMode']?.toString() ?? 'NONE',
      resolvedPlanId: (json['resolvedPlanId'] as num?)?.toInt(),
      plan: p,
      hint: json['hint']?.toString(),
      lastServiceMileage:
          (json['lastServiceMileage'] as num?)?.toInt(),
      lastServiceDate: json['lastServiceDate']?.toString(),
      nextCommittedServiceMileage:
          (json['nextCommittedServiceMileage'] as num?)?.toInt(),
      nextCommittedServiceDate:
          json['nextCommittedServiceDate']?.toString(),
    );
  }
}
