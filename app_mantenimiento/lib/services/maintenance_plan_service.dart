import '../config/api_config.dart';
import '../models/maintenance_plan/maintenance_plan_response.dart';
import '../models/maintenance_plan/vehicle_maintenance_plan_match_response.dart';
import 'api_service.dart';

class MaintenancePlanService {
  Future<List<MaintenancePlanResponse>> getAllPlans() async {
    final data = await ApiService.get(ApiConfig.maintenancePlans);
    return ApiPayload.decodeList(data)
        .map(MaintenancePlanResponse.fromJson)
        .toList();
  }

  Future<VehicleMaintenancePlanMatchResponse>
      resolveForVehicle(int vehicleId) async {
    final raw = await ApiService.get(
        ApiConfig.maintenancePlanResolveForVehicle(vehicleId));
    return VehicleMaintenancePlanMatchResponse.fromJson(
        ApiPayload.decodeMap(raw));
  }

  Future<void> incorporatePreventiveFromTemplate(int vehicleId) async {
    await ApiService.post(ApiConfig.vehiclePreventiveIncorporate(vehicleId));
  }
}
