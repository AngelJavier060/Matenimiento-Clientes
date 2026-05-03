import '../config/api_config.dart';
import '../models/vehicle/vehicle_request.dart';
import '../models/vehicle/vehicle_response.dart';
import 'api_service.dart';

class VehicleService {
  Future<List<VehicleResponse>> getVehicles() async {
    final data = await ApiService.get(ApiConfig.vehicles);
    final list = data['content'] as List? ?? data as List? ?? [];
    return list.map((e) => VehicleResponse.fromJson(e)).toList();
  }

  Future<VehicleResponse> getVehicleById(int id) async {
    final data = await ApiService.get(ApiConfig.vehicleById(id));
    return VehicleResponse.fromJson(data);
  }

  Future<VehicleResponse> createVehicle(VehicleRequest request) async {
    final data = await ApiService.post(
      ApiConfig.vehicles,
      body: request.toJson(),
    );
    return VehicleResponse.fromJson(data);
  }

  Future<VehicleResponse> updateVehicle(int id, VehicleRequest request) async {
    final data = await ApiService.put(
      ApiConfig.vehicleById(id),
      body: request.toJson(),
    );
    return VehicleResponse.fromJson(data);
  }

  Future<void> deleteVehicle(int id) async {
    await ApiService.delete(ApiConfig.vehicleById(id));
  }
}
