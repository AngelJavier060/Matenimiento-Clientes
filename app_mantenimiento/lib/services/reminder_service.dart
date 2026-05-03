import '../config/api_config.dart';
import '../models/reminder/reminder_request.dart';
import '../models/reminder/reminder_response.dart';
import 'api_service.dart';

class ReminderService {
  Future<List<ReminderResponse>> getRemindersByVehicle(int vehicleId) async {
    final data = await ApiService.get(ApiConfig.remindersByVehicle(vehicleId));
    final list = data['content'] as List? ?? data as List? ?? [];
    return list.map((e) => ReminderResponse.fromJson(e)).toList();
  }

  Future<ReminderResponse> createReminder(ReminderRequest request) async {
    final data = await ApiService.post(
      ApiConfig.reminders,
      body: request.toJson(),
    );
    return ReminderResponse.fromJson(data);
  }

  Future<ReminderResponse> updateReminder(
      int id, ReminderRequest request) async {
    final data = await ApiService.put(
      ApiConfig.reminderById(id),
      body: request.toJson(),
    );
    return ReminderResponse.fromJson(data);
  }

  Future<void> deleteReminder(int id) async {
    await ApiService.delete(ApiConfig.reminderById(id));
  }
}
