import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/vehicle/vehicle_response.dart';
import '../../providers/maintenance_provider.dart';
import '../../providers/reminder_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../widgets/maintenance_card.dart';
import '../../widgets/reminder_card.dart';

class VehicleDetailScreen extends StatefulWidget {
  const VehicleDetailScreen({super.key});

  @override
  State<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends State<VehicleDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final vehicle = context.read<VehicleProvider>().selectedVehicle;
      if (vehicle != null) {
        context.read<MaintenanceProvider>().loadMaintenances(vehicle.id);
        context.read<ReminderProvider>().loadReminders(vehicle.id);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vehicle = context.watch<VehicleProvider>().selectedVehicle;

    if (vehicle == null) {
      return const Scaffold(
        body: Center(child: Text('Vehículo no encontrado')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(vehicle.fullName),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_rounded),
            onPressed: () async {
              final result =
                  await Navigator.pushNamed(context, '/vehicles/form');
              if (result == true && mounted) {
                context.read<VehicleProvider>().loadVehicles();
              }
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'Info', icon: Icon(Icons.info_outline)),
            Tab(text: 'Mantenimiento', icon: Icon(Icons.build_outlined)),
            Tab(text: 'Recordatorios', icon: Icon(Icons.notifications_outlined)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _VehicleInfoTab(vehicle: vehicle),
          _VehicleMaintenancesTab(vehicleId: vehicle.id),
          _VehicleRemindersTab(vehicleId: vehicle.id),
        ],
      ),
    );
  }
}

class _VehicleInfoTab extends StatelessWidget {
  final VehicleResponse vehicle;

  const _VehicleInfoTab({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.directions_car_rounded,
                      size: 64,
                      color: AppColors.accent,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    vehicle.fullName,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    vehicle.licensePlate ?? 'Sin placa',
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _infoRow('Marca', vehicle.brand),
                  _infoRow('Modelo', vehicle.model),
                  _infoRow('Año', '${vehicle.year}'),
                  _infoRow('Placa', vehicle.licensePlate ?? '-'),
                  _infoRow('VIN', vehicle.vin ?? '-'),
                  _infoRow('Kilometraje', '${vehicle.mileage ?? 0} km'),
                  _infoRow('Combustible', vehicle.fuelType ?? '-'),
                  _infoRow('Transmisión', vehicle.transmission ?? '-'),
                  _infoRow('Color', vehicle.color ?? '-'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(color: AppColors.textSecondary)),
          Text(value,
              style: const TextStyle(
                  fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}

class _VehicleMaintenancesTab extends StatelessWidget {
  final int vehicleId;

  const _VehicleMaintenancesTab({required this.vehicleId});

  @override
  Widget build(BuildContext context) {
    return Consumer<MaintenanceProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.maintenances.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.build_outlined,
                    size: 64, color: AppColors.textSecondary.withOpacity(0.3)),
                const SizedBox(height: 12),
                const Text('Sin mantenimientos registrados',
                    style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.only(top: 8, bottom: 80),
          itemCount: provider.maintenances.length,
          itemBuilder: (context, index) {
            final m = provider.maintenances[index];
            return MaintenanceCard(
              maintenance: m,
              onTap: () {},
              onDelete: () => provider.deleteMaintenance(m.id, vehicleId),
            );
          },
        );
      },
    );
  }
}

class _VehicleRemindersTab extends StatelessWidget {
  final int vehicleId;

  const _VehicleRemindersTab({required this.vehicleId});

  @override
  Widget build(BuildContext context) {
    return Consumer<ReminderProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.reminders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.notifications_outlined,
                    size: 64, color: AppColors.textSecondary.withOpacity(0.3)),
                const SizedBox(height: 12),
                const Text('Sin recordatorios',
                    style: TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.only(top: 8, bottom: 80),
          itemCount: provider.reminders.length,
          itemBuilder: (context, index) {
            final r = provider.reminders[index];
            return ReminderCard(
              reminder: r,
              onTap: () {},
              onDelete: () => provider.deleteReminder(r.id, vehicleId),
            );
          },
        );
      },
    );
  }
}
