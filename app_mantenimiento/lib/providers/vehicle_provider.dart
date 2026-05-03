import 'package:flutter/material.dart';
import '../models/vehicle/vehicle_request.dart';
import '../models/vehicle/vehicle_response.dart';
import '../services/vehicle_service.dart';

class VehicleProvider extends ChangeNotifier {
  final VehicleService _vehicleService = VehicleService();

  List<VehicleResponse> _vehicles = [];
  VehicleResponse? _selectedVehicle;
  bool _isLoading = false;
  String? _error;

  List<VehicleResponse> get vehicles => _vehicles;
  VehicleResponse? get selectedVehicle => _selectedVehicle;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadVehicles() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _vehicles = await _vehicleService.getVehicles();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createVehicle(VehicleRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _vehicleService.createVehicle(request);
      await loadVehicles();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateVehicle(int id, VehicleRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedVehicle = await _vehicleService.updateVehicle(id, request);
      await loadVehicles();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteVehicle(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _vehicleService.deleteVehicle(id);
      _selectedVehicle = null;
      await loadVehicles();
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void selectVehicle(VehicleResponse? vehicle) {
    _selectedVehicle = vehicle;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
