import 'maintenance_plan_activity_response.dart';

class MaintenancePlanResponse {
  final int id;
  final String? marca;
  final String? modelo;
  final int? anio;
  final String? motor;
  final String? tipoAceite;
  final String? fuente;
  final bool? isActive;
  final List<MaintenancePlanActivityResponse>? activities;
  final int activityCount;

  MaintenancePlanResponse({
    required this.id,
    this.marca,
    this.modelo,
    this.anio,
    this.motor,
    this.tipoAceite,
    this.fuente,
    this.isActive,
    this.activities,
    this.activityCount = 0,
  });

  String get summary {
    final m = marca ?? '';
    final md = modelo ?? '';
    final y = anio;
    return y != null ? '$m $md ($y)' : '$m $md'.trim();
  }

  factory MaintenancePlanResponse.fromJson(Map<String, dynamic> json) {
    List<MaintenancePlanActivityResponse>? acts;
    final rawActs = json['activities'];
    if (rawActs is List) {
      acts = rawActs.whereType<Map>().map((Map<dynamic, dynamic> e) {
        return MaintenancePlanActivityResponse.fromJson(
            Map<String, dynamic>.from(e));
      }).toList();
    }

    return MaintenancePlanResponse(
      id: (json['id'] as num?)?.toInt() ?? 0,
      marca: json['marca']?.toString(),
      modelo: json['modelo']?.toString(),
      anio: (json['anio'] as num?)?.toInt(),
      motor: json['motor']?.toString(),
      tipoAceite: json['tipoAceite']?.toString(),
      fuente: json['fuente']?.toString(),
      isActive: json['isActive'] as bool?,
      activities: acts,
      activityCount:
          (json['activityCount'] as num?)?.toInt() ?? acts?.length ?? 0,
    );
  }
}
