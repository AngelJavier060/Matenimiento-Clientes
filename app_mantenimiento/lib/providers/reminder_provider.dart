import 'package:flutter/material.dart';
import '../models/reminder/reminder_request.dart';
import '../models/reminder/reminder_response.dart';
import '../services/reminder_service.dart';

class ReminderProvider extends ChangeNotifier {
  final ReminderService _reminderService = ReminderService();

  List<ReminderResponse> _reminders = [];
  bool _isLoading = false;
  String? _error;

  List<ReminderResponse> get reminders => _reminders;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadReminders(int vehicleId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reminders = await _reminderService.getRemindersByVehicle(vehicleId);
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createReminder(ReminderRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _reminderService.createReminder(request);
      await loadReminders(request.vehicleId);
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateReminder(int id, ReminderRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _reminderService.updateReminder(id, request);
      await loadReminders(request.vehicleId);
      return true;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteReminder(int id, int vehicleId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _reminderService.deleteReminder(id);
      await loadReminders(vehicleId);
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
