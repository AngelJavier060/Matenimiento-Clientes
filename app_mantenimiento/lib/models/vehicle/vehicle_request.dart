class VehicleRequest {
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
  final String? notes;
  final int? maintenancePlanId;
  final int? nextCommittedServiceMileage;
  final String? nextCommittedServiceDate;

  VehicleRequest({
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
    this.notes,
    this.maintenancePlanId,
    this.nextCommittedServiceMileage,
    this.nextCommittedServiceDate,
  });

  Map<String, dynamic> toJson() {
    final url = imageUrl?.trim();
    final m = <String, dynamic>{
      'brand': brand,
      'model': model,
      'year': year,
      'licensePlate': licensePlate,
      'vin': vin,
      'mileage': mileage,
      'fuelType': fuelType,
      'transmission': transmission,
      'color': color,
      'notes': notes,
      'maintenancePlanId': maintenancePlanId,
      'nextCommittedServiceMileage': nextCommittedServiceMileage,
      'nextCommittedServiceDate': nextCommittedServiceDate,
    };
    if (url != null && url.isNotEmpty) {
      m['imageUrl'] = url;
    }
    if (clientId != null) {
      m['clientId'] = clientId;
    }
    return m;
  }
}
