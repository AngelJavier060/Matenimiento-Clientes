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
  final String? notes;
  final bool isActive;
  final String? createdAt;
  final String? updatedAt;
  final int maintenanceCount;

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
    this.notes,
    required this.isActive,
    this.createdAt,
    this.updatedAt,
    this.maintenanceCount = 0,
  });

  factory VehicleResponse.fromJson(Map<String, dynamic> json) =>
      VehicleResponse(
        id: json['id'] ?? 0,
        brand: json['brand'] ?? '',
        model: json['model'] ?? '',
        year: json['year'] ?? 0,
        licensePlate: json['licensePlate'],
        vin: json['vin'],
        mileage: json['mileage'],
        fuelType: json['fuelType'],
        transmission: json['transmission'],
        color: json['color'],
        notes: json['notes'],
        isActive: json['isActive'] ?? true,
        createdAt: json['createdAt'],
        updatedAt: json['updatedAt'],
        maintenanceCount: json['maintenanceCount'] ?? 0,
      );

  String get fullName => '$brand $model $year';
}
