import '../config/api_config.dart';
import '../models/reminder/reminder_response.dart';
import 'api_service.dart';

class ReminderService {
  Future<List<ReminderResponse>> getUserReminders() async {
    final data = await ApiService.get(ApiConfig.reminders);
    return ApiPayload.decodeList(data).map((e) => ReminderResponse.fromJson(e)).toList();
  }

  Future<List<ReminderResponse>> getDueReminders() async {
    final data = await ApiService.get(ApiConfig.remindersDue);
    return ApiPayload.decodeList(data).map((e) => ReminderResponse.fromJson(e)).toList();
  }

  Future<List<ReminderResponse>> getRemindersByVehicle(int vehicleId) async {
    final data =
        await ApiService.get(ApiConfig.remindersByVehicle(vehicleId));
    return ApiPayload.decodeList(data).map((e) => ReminderResponse.fromJson(e)).toList();
  }

  Future<void> deleteReminder(int id) async {
    await ApiService.delete(ApiConfig.reminderById(id));
  }

  Future<void> toggleReminder(int id) async {
    await ApiService.patch(ApiConfig.reminderToggle(id));
  }
}
