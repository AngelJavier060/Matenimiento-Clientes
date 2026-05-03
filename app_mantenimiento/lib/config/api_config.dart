class ApiConfig {
  ApiConfig._();

  static const String baseUrl = 'http://172.27.32.1:8080/api';

  static const String authRegister = '/auth/register';
  static const String authLogin = '/auth/login';
  static const String authRefresh = '/auth/refresh';

  static const String vehicles = '/vehicles';
  static String vehicleById(int id) => '/vehicles/$id';
  static String vehicleByUser(int userId) => '/vehicles/user/$userId';

  static const String maintenances = '/maintenances';
  static String maintenanceById(int id) => '/maintenances/$id';
  static String maintenancesByVehicle(int vehicleId) =>
      '/maintenances/vehicle/$vehicleId';

  static const String reminders = '/reminders';
  static String reminderById(int id) => '/reminders/$id';
  static String remindersByVehicle(int vehicleId) =>
      '/reminders/vehicle/$vehicleId';
  static String remindersByUser(int userId) => '/reminders/user/$userId';
}
