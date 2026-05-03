import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/vehicle_provider.dart';
import '../../providers/maintenance_provider.dart';
import '../../widgets/maintenance_card.dart';

class MaintenanceListScreen extends StatefulWidget {
  const MaintenanceListScreen({super.key});

  @override
  State<MaintenanceListScreen> createState() => _MaintenanceListScreenState();
}

class _MaintenanceListScreenState extends State<MaintenanceListScreen> {
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
    final provider = context.watch<MaintenanceProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mantenimientos'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result =
              await Navigator.pushNamed(context, '/maintenance/form');
          if (result == true && mounted && _selectedVehicleId != null) {
            provider.loadMaintenances(_selectedVehicleId!);
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
                  prefixIcon:
                      Icon(Icons.directions_car_rounded, color: AppColors.accent),
                  filled: true,
                  fillColor: AppColors.backgroundLight,
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
                    provider.loadMaintenances(v);
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
                        Icon(Icons.build_outlined,
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
                    : provider.maintenances.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.build_outlined,
                                    size: 64,
                                    color: AppColors.textSecondary
                                        .withOpacity(0.3)),
                                const SizedBox(height: 12),
                                const Text('Sin mantenimientos',
                                    style: TextStyle(
                                        color: AppColors.textSecondary)),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () =>
                                provider.loadMaintenances(_selectedVehicleId!),
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 8, bottom: 80),
                              itemCount: provider.maintenances.length,
                              itemBuilder: (context, index) {
                                final m = provider.maintenances[index];
                                return MaintenanceCard(
                                  maintenance: m,
                                  onTap: () {},
                                  onDelete: () => provider.deleteMaintenance(
                                      m.id, _selectedVehicleId!),
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
