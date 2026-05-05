class MaintenancePlanActivityResponse {
  final int id;
  final int? clonedFromPlanActivityId;
  final String nombre;
  final String tipo;
  final int? intervaloKm;
  final int? intervaloMeses;
  final bool? isActive;

  MaintenancePlanActivityResponse({
    required this.id,
    this.clonedFromPlanActivityId,
    required this.nombre,
    required this.tipo,
    this.intervaloKm,
    this.intervaloMeses,
    this.isActive,
  });

  factory MaintenancePlanActivityResponse.fromJson(
          Map<String, dynamic> json) =>
      MaintenancePlanActivityResponse(
        id: (json['id'] as num?)?.toInt() ?? 0,
        clonedFromPlanActivityId: (json['clonedFromPlanActivityId'] as num?)
            ?.toInt(),
        nombre: json['nombre']?.toString() ?? '',
        tipo: json['tipo']?.toString() ?? '',
        intervaloKm: (json['intervaloKm'] as num?)?.toInt(),
        intervaloMeses: (json['intervaloMeses'] as num?)?.toInt(),
        isActive: json['isActive'] as bool?,
      );
}
