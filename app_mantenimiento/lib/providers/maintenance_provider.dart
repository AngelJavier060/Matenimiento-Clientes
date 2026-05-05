import 'package:flutter/material.dart';
import '../models/maintenance/maintenance_request.dart';
import '../models/maintenance/maintenance_response.dart';
import '../services/maintenance_service.dart';

class MaintenanceProvider extends ChangeNotifier {
  final MaintenanceService _maintenanceService = MaintenanceService();

  List<MaintenanceResponse> _maintenances = [];
  bool _isLoading = false;
  String? _error;
  /// Evita aplicar respuestas viejas si el usuario cambia de vehículo muy rápido.
  int _loadGeneration = 0;

  List<MaintenanceResponse> get maintenances => _maintenances;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadMaintenances(int vehicleId) async {
    final gen = ++_loadGeneration;
    _isLoading = true;
    _error = null;
    _maintenances = [];
    notifyListeners();

    try {
      final list =
          await _maintenanceService.getMaintenancesByVehicle(vehicleId);
      if (gen != _loadGeneration) return;
      _maintenances = list;
      _error = null;
    } catch (e) {
      if (gen != _loadGeneration) return;
      _maintenances = [];
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (gen == _loadGeneration) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  Future<bool> createMaintenance(MaintenanceRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _maintenanceService.createMaintenance(request);
      await loadMaintenances(request.vehicleId);
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateMaintenance(int id, MaintenanceRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _maintenanceService.updateMaintenance(id, request);
      await loadMaintenances(request.vehicleId);
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteMaintenance(int id, int vehicleId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _maintenanceService.deleteMaintenance(id);
      await loadMaintenances(vehicleId);
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
