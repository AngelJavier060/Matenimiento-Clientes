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
  final String? notes;

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
    this.notes,
  });

  Map<String, dynamic> toJson() => {
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
      };
}
