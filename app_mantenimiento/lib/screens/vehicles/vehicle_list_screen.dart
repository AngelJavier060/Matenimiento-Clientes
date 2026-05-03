import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../providers/vehicle_provider.dart';
import '../../widgets/vehicle_card.dart';

class VehicleListScreen extends StatefulWidget {
  const VehicleListScreen({super.key});

  @override
  State<VehicleListScreen> createState() => _VehicleListScreenState();
}

class _VehicleListScreenState extends State<VehicleListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VehicleProvider>().loadVehicles();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Vehículos'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.pushNamed(context, '/vehicles/form');
          if (result == true && mounted) {
            context.read<VehicleProvider>().loadVehicles();
          }
        },
        child: const Icon(Icons.add),
      ),
      body: Consumer<VehicleProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.vehicles.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.vehicles.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.directions_car_rounded,
                      size: 80, color: AppColors.textSecondary.withOpacity(0.3)),
                  const SizedBox(height: 16),
                  const Text(
                    'No tienes vehículos registrados',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.pushNamed(
                          context, '/vehicles/form');
                      if (result == true && mounted) {
                        context.read<VehicleProvider>().loadVehicles();
                      }
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Agregar Vehículo'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadVehicles(),
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 80),
              itemCount: provider.vehicles.length,
              itemBuilder: (context, index) {
                final vehicle = provider.vehicles[index];
                return VehicleCard(
                  vehicle: vehicle,
                  onTap: () async {
                    provider.selectVehicle(vehicle);
                    await Navigator.pushNamed(context, '/vehicles/detail');
                    provider.selectVehicle(null);
                  },
                  onDelete: () => _confirmDelete(context, vehicle.id),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, int id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar vehículo'),
        content:
            const Text('¿Estás seguro? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<VehicleProvider>().deleteVehicle(id);
            },
            child: const Text('Eliminar', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
