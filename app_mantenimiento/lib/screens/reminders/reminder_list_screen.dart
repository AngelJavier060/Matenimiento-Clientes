import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/vehicle_provider.dart';
import '../../providers/reminder_provider.dart';
import '../../widgets/reminder_card.dart';

class ReminderListScreen extends StatefulWidget {
  const ReminderListScreen({super.key});

  @override
  State<ReminderListScreen> createState() => _ReminderListScreenState();
}

class _ReminderListScreenState extends State<ReminderListScreen> {
  int? _selectedVehicleId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VehicleProvider>().loadVehicles();
    });
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = context.watch<VehicleProvider>().vehicles;
    final provider = context.watch<ReminderProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recordatorios'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result =
              await Navigator.pushNamed(context, '/reminders/form');
          if (result == true && mounted && _selectedVehicleId != null) {
            provider.loadReminders(_selectedVehicleId!);
          }
        },
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          if (vehicles.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              child: DropdownButtonFormField<int>(
                value: _selectedVehicleId,
                decoration: const InputDecoration(
                  labelText: 'Seleccionar vehículo',
                  prefixIcon: Icon(Icons.directions_car_rounded,
                      color: AppColors.accent),
                ),
                items: vehicles.map((v) {
                  return DropdownMenuItem(
                    value: v.id,
                    child: Text(v.fullName),
                  );
                }).toList(),
                onChanged: (v) {
                  setState(() => _selectedVehicleId = v);
                  if (v != null) {
                    provider.loadReminders(v);
                  }
                },
              ),
            ),
          Expanded(
            child: _selectedVehicleId == null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_active_rounded,
                            size: 64,
                            color: AppColors.textSecondary.withOpacity(0.3)),
                        const SizedBox(height: 12),
                        const Text('Selecciona un vehículo',
                            style: TextStyle(color: AppColors.textSecondary)),
                      ],
                    ),
                  )
                : provider.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : provider.reminders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.notifications_off_rounded,
                                    size: 64,
                                    color: AppColors.textSecondary
                                        .withOpacity(0.3)),
                                const SizedBox(height: 12),
                                const Text('Sin recordatorios',
                                    style: TextStyle(
                                        color: AppColors.textSecondary)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () =>
                                provider.loadReminders(_selectedVehicleId!),
                            child: ListView.builder(
                              padding: const EdgeInsets.only(
                                  top: 8, bottom: 80),
                              itemCount: provider.reminders.length,
                              itemBuilder: (context, index) {
                                final r = provider.reminders[index];
                                return ReminderCard(
                                  reminder: r,
                                  onTap: () {},
                                  onDelete: () => provider.deleteReminder(
                                      r.id, _selectedVehicleId!),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
