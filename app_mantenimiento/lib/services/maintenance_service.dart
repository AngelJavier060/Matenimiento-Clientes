import '../config/api_config.dart';
import '../models/maintenance/maintenance_request.dart';
import '../models/maintenance/maintenance_response.dart';
import 'api_service.dart';

class MaintenanceService {
  Future<List<MaintenanceResponse>> getMaintenancesByVehicle(
      int vehicleId) async {
    final data =
        await ApiService.get(ApiConfig.maintenancesByVehicle(vehicleId));
    final list = data['content'] as List? ?? data as List? ?? [];
    return list.map((e) => MaintenanceResponse.fromJson(e)).toList();
  }

  Future<MaintenanceResponse> createMaintenance(
      MaintenanceRequest request) async {
    final data = await ApiService.post(
      ApiConfig.maintenances,
      body: request.toJson(),
    );
    return MaintenanceResponse.fromJson(data);
  }

  Future<MaintenanceResponse> updateMaintenance(
      int id, MaintenanceRequest request) async {
    final data = await ApiService.put(
      ApiConfig.maintenanceById(id),
      body: request.toJson(),
    );
    return MaintenanceResponse.fromJson(data);
  }

  Future<void> deleteMaintenance(int id) async {
    await ApiService.delete(ApiConfig.maintenanceById(id));
  }
}
