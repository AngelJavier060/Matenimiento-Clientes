import 'package:flutter/material.dart';
import '../models/reminder/reminder_response.dart';
import '../services/reminder_service.dart';

class ReminderProvider extends ChangeNotifier {
  final ReminderService _reminderService = ReminderService();

  List<ReminderResponse> _dueReminders = [];
  List<ReminderResponse> _userReminders = [];
  List<ReminderResponse> _vehicleReminders = [];

  bool _isLoading = false;
  String? _error;

  /// Contadores opcionales para dashboard (actualizar con refreshDashboardCounters).
  int dueCountCached = 0;
  int activeRemindersCached = 0;

  List<ReminderResponse> get dueReminders => _dueReminders;
  List<ReminderResponse> get userReminders => _userReminders;
  List<ReminderResponse> get reminders => _vehicleReminders;

  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> refreshDashboardCounters() async {
    try {
      final due = await _reminderService.getDueReminders();
      final all = await _reminderService.getUserReminders();
      dueCountCached = due.length;
      activeRemindersCached =
          all.where((r) => r.isActive).length;
      notifyListeners();
    } catch (_) {
      dueCountCached = 0;
      activeRemindersCached = 0;
      notifyListeners();
    }
  }

  Future<void> loadDueReminders() async {
    _startLoad();
    try {
      _dueReminders =
          await _reminderService.getDueReminders();
    } catch (e) {
      _error = _msg(e);
    }
    _finishLoad();
  }

  Future<void> loadUserReminders() async {
    _startLoad();
    try {
      _userReminders =
          await _reminderService.getUserReminders();
    } catch (e) {
      _error = _msg(e);
    }
    _finishLoad();
  }

  Future<void> loadReminders(int vehicleId) async {
    _startLoad();
    try {
      _vehicleReminders =
          await _reminderService.getRemindersByVehicle(vehicleId);
    } catch (e) {
      _error = _msg(e);
    }
    _finishLoad();
  }

  Future<bool> toggleReminder(int id) async {
    _error = null;
    try {
      await _reminderService.toggleReminder(id);
      await refreshDashboardCounters();
      notifyListeners();
      return true;
    } catch (e) {
      _error = _msg(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteReminder(int id) async {
    _error = null;
    try {
      await _reminderService.deleteReminder(id);
      await refreshDashboardCounters();
      notifyListeners();
      return true;
    } catch (e) {
      _error = _msg(e);
      notifyListeners();
      return false;
    }
  }

  void _startLoad() {
    _isLoading = true;
    _error = null;
    notifyListeners();
  }

  void _finishLoad() {
    _isLoading = false;
    notifyListeners();
  }

  String _msg(Object e) => e.toString().replaceFirst('Exception: ', '');

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
