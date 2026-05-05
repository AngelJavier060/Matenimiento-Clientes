class VehicleResponse {
  final int id;
  final String brand;
  final String model;
  final int year;
  final String? licensePlate;
  final String? vin;
  final int? mileage;
  final String? fuelType;
  final String? transmission;
  final String? color;
  final String? imageUrl;
  final int? clientId;
  final String? clientName;
  final String? notes;
  final bool isActive;
  final String? createdAt;
  final String? updatedAt;
  final int maintenanceCount;
  final int? maintenancePlanId;
  final int? nextCommittedServiceMileage;
  final String? nextCommittedServiceDate;

  VehicleResponse({
    required this.id,
    required this.brand,
    required this.model,
    required this.year,
    this.licensePlate,
    this.vin,
    this.mileage,
    this.fuelType,
    this.transmission,
    this.color,
    this.imageUrl,
    this.clientId,
    this.clientName,
    this.notes,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
    this.maintenanceCount = 0,
    this.maintenancePlanId,
    this.nextCommittedServiceMileage,
    this.nextCommittedServiceDate,
  });

  factory VehicleResponse.fromJson(Map<String, dynamic> json) =>
      VehicleResponse(
        id: (json['id'] as num?)?.toInt() ?? 0,
        brand: json['brand']?.toString() ?? '',
        model: json['model']?.toString() ?? '',
        year: (json['year'] as num?)?.toInt() ?? 0,
        licensePlate: json['licensePlate']?.toString(),
        vin: json['vin']?.toString(),
        mileage: (json['mileage'] as num?)?.toInt(),
        fuelType: json['fuelType']?.toString(),
        transmission: json['transmission']?.toString(),
        color: json['color']?.toString(),
        imageUrl: json['imageUrl']?.toString(),
        clientId: (json['clientId'] as num?)?.toInt(),
        clientName: json['clientName']?.toString(),
        notes: json['notes']?.toString(),
        isActive: json['isActive'] as bool? ?? true,
        createdAt: json['createdAt']?.toString(),
        updatedAt: json['updatedAt']?.toString(),
        maintenanceCount: (json['maintenanceCount'] as num?)?.toInt() ?? 0,
        maintenancePlanId: (json['maintenancePlanId'] as num?)?.toInt(),
        nextCommittedServiceMileage:
            (json['nextCommittedServiceMileage'] as num?)?.toInt(),
        nextCommittedServiceDate:
            json['nextCommittedServiceDate']?.toString(),
      );

  String get fullName => '$brand $model $year';

  /// Lista desplegable compacta (marca — placa) para evitar overflow.
  String get marcaPlacaLabel {
    final placa = licensePlate?.trim();
    final m = brand.trim();
    final base =
        m.isEmpty ? '${model.trim()} #$id'.trim() : m;
    if (placa != null && placa.isNotEmpty) {
      return '$base — $placa';
    }
    return base;
  }
}
