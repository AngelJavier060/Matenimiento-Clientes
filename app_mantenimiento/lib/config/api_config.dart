import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;

/// Base URL del backend (`.../api` sin slash final opcional normalizado internamente si viene de env).
///
/// Para **teléfono físico** en la misma Wi‑Fi que la PC donde corre Spring:
/// ```bash
/// flutter run --dart-define=API_BASE_URL=http://192.168.1.X:8080/api
/// ```
/// Use la IPv4 que muestre `ipconfig` / `ip a` (WLAN), no localhost desde el teléfono.
///
/// **Emulador Android**: por defecto `10.0.2.2`.
/// **iOS Simulator / escritorio**: `127.0.0.1`.
class ApiConfig {
  ApiConfig._();

  static const String _fromEnv =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  /// Host del backend sin `/api` (p. ej. `http://10.0.2.2:8080`) para rutas públicas tipo `/uploads/...`.
  static String get httpOrigin => Uri.parse(baseUrl).origin;

  static String get baseUrl {
    if (_fromEnv.isNotEmpty) {
      final u = _fromEnv.trim();
      return u.endsWith('/') ? u.substring(0, u.length - 1) : u;
    }
    if (kIsWeb) {
      return 'http://localhost:8080/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8080/api';
    }
    return 'http://127.0.0.1:8080/api';
  }

  static const String authRegister = '/auth/register';
  static const String authLogin = '/auth/login';
  static const String authRefresh = '/auth/refresh';

  static const String clients = '/clients';
  static String clientById(int id) => '/clients/$id';

  static const String vehicles = '/vehicles';
  static String vehicleById(int id) => '/vehicles/$id';
  static String vehiclesByUser(int userId) => '/vehicles/by-user/$userId';
  static String vehiclesByClient(int clientId) =>
      '/vehicles/by-client/$clientId';

  static String vehiclePreventiveIncorporate(int vehicleId) =>
      '/vehicles/$vehicleId/preventive-activities/incorporate-from-template';

  static const String maintenance = '/maintenance';
  static String maintenanceById(int id) => '/maintenance/$id';
  static String maintenancesByVehicle(int vehicleId) =>
      '/maintenance/vehicle/$vehicleId';

  static const String reminders = '/reminders';
  static String reminderById(int id) => '/reminders/$id';
  static const String remindersDue = '/reminders/due';
  static String remindersByVehicle(int vehicleId) =>
      '/reminders/vehicle/$vehicleId';
  static String reminderToggle(int id) => '/reminders/$id/toggle';

  static const String maintenancePlans = '/maintenance-plans';
  static String maintenancePlanById(int id) => '/maintenance-plans/$id';
  static String maintenancePlanResolveForVehicle(int vehicleId) =>
      '/maintenance-plans/for-vehicle/$vehicleId';

  static const String uploadVehiclePhoto = '/upload/vehicle-photo';
}
