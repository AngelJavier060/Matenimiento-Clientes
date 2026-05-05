import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/vehicle/vehicle_response.dart';
import '../../providers/maintenance_provider.dart';
import '../../providers/reminder_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../utils/vehicle_image_url.dart';
import '../../widgets/maintenance_card.dart';
import '../../widgets/preventive_plan_panel.dart';
import '../../widgets/reminder_card.dart';
import '../maintenance/maintenance_form_screen.dart';

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
    _tabController = TabController(length: 4, vsync: this);

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
          isScrollable: true,
          tabs: const [
            Tab(text: 'Info', icon: Icon(Icons.info_outline)),
            Tab(text: 'Mantenimiento', icon: Icon(Icons.build_outlined)),
            Tab(text: 'Preventivo', icon: Icon(Icons.folder_special_outlined)),
            Tab(text: 'Recordatorios', icon: Icon(Icons.notifications_outlined)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _VehicleInfoTab(vehicle: vehicle),
          _VehicleMaintenancesTab(vehicleId: vehicle.id),
          PreventivePlanPanel(vehicleId: vehicle.id),
          _VehicleRemindersTab(vehicleId: vehicle.id),
        ],
      ),
    );
  }
}

class _VehicleInfoTab extends StatefulWidget {
  final VehicleResponse vehicle;

  const _VehicleInfoTab({required this.vehicle});

  @override
  State<_VehicleInfoTab> createState() => _VehicleInfoTabState();
}

class _VehicleInfoTabState extends State<_VehicleInfoTab> {
  final ImagePicker _picker = ImagePicker();
  bool _uploadingPhoto = false;

  VehicleResponse get vehicle => widget.vehicle;

  Future<void> _pickAndUpload(ImageSource source) async {
    if (_uploadingPhoto) return;
    Navigator.of(context).pop();

    try {
      final file = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (!mounted || file == null) return;

      setState(() => _uploadingPhoto = true);

      final provider = context.read<VehicleProvider>();
      final ok = await provider.uploadVehiclePhoto(
        vehicleId: vehicle.id,
        localFilePath: file.path,
      );

      if (!mounted) return;
      setState(() => _uploadingPhoto = false);

      final messenger = ScaffoldMessenger.of(context);

      if (ok) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Foto actualizada correctamente.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        messenger.showSnackBar(
          SnackBar(
            content:
                Text(provider.error ?? 'No se pudo subir la foto.'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _uploadingPhoto = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo obtener la imagen.'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showPhotoOptionsSheet() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined,
                    color: AppColors.accent),
                title: const Text('Elegir de la galería'),
                onTap: () => _pickAndUpload(ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined,
                    color: AppColors.accent),
                title: const Text('Tomar foto'),
                onTap: () => _pickAndUpload(ImageSource.camera),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _photoFallback() {
    return Container(
      width: double.infinity,
      color: AppColors.accent.withOpacity(0.08),
      alignment: Alignment.center,
      child: const Icon(
        Icons.directions_car_rounded,
        size: 64,
        color: AppColors.accent,
      ),
    );
  }

  Widget _photoLayer(String? resolved, bool hasPhoto) {
    final Widget base = (hasPhoto && resolved != null)
        ? Image.network(
            resolved,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (_, __, ___) => _photoFallback(),
          )
        : _photoFallback();

    return Stack(
      fit: StackFit.expand,
      clipBehavior: Clip.hardEdge,
      children: [
        base,
        if (_uploadingPhoto)
          Container(
            color: Colors.black38,
            child: const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          ),
        Positioned(
          right: 10,
          bottom: 10,
          child: Material(
            elevation: 3,
            color: Colors.black54,
            borderRadius: BorderRadius.circular(24),
            child: InkWell(
              borderRadius: BorderRadius.circular(24),
              onTap: _uploadingPhoto ? null : _showPhotoOptionsSheet,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.photo_camera_rounded,
                        color: Colors.white, size: 20),
                    SizedBox(width: 6),
                    Text(
                      'Cambiar foto',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final resolved = VehicleImageUrl.resolve(vehicle.imageUrl);
    final hasPhoto = VehicleImageUrl.canLoadNetwork(vehicle.imageUrl);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: _photoLayer(resolved, hasPhoto),
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
                  if ((vehicle.clientName ?? '').trim().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      vehicle.clientName!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
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
                  _infoRow(
                    'Cliente',
                    (vehicle.clientName != null &&
                            vehicle.clientName!.trim().isNotEmpty)
                        ? '${vehicle.clientName} (#${vehicle.clientId ?? "-"})'
                        : '-',
                  ),
                  _infoRow(
                    'Plan MP fijo en unidad',
                    vehicle.maintenancePlanId != null
                        ? '#${vehicle.maintenancePlanId}'
                        : 'No (solo MMY si aplica)',
                  ),
                  _infoRow(
                    'Próx. pactado km',
                    vehicle.nextCommittedServiceMileage != null
                        ? '${vehicle.nextCommittedServiceMileage}'
                        : '-',
                  ),
                  _infoRow(
                    'Próx. pactado fecha',
                    (vehicle.nextCommittedServiceDate ?? '-').trim().isEmpty
                        ? '-'
                        : (vehicle.nextCommittedServiceDate ?? '-'),
                  ),
                  _infoRow(
                    'Registros de mantenimiento',
                    '${vehicle.maintenanceCount}',
                  ),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(
                  fontWeight: FontWeight.w500, color: AppColors.textPrimary),
            ),
          ),
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
                    size: 64,
                    color: AppColors.textSecondary.withOpacity(0.3)),
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
        if (provider.isLoading && provider.reminders.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.reminders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.notifications_outlined,
                    size: 64,
                    color: AppColors.textSecondary.withOpacity(0.3)),
                const SizedBox(height: 12),
                const Text(
                  'Sin recordatorios',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      '/maintenance/form',
                      arguments: MaintenanceFormArgs(initialVehicleId: vehicleId),
                    );
                  },
                  icon: const Icon(Icons.build_outlined),
                  label: const Text(
                      'Registrar mantenimiento (genera avisos automáticos)'),
                ),
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
              onDelete: () async {
                final ok = await provider.deleteReminder(r.id);
                if (!context.mounted) return;
                if (ok) await provider.loadReminders(vehicleId);
              },
              onToggleActive: () async {
                final ok = await provider.toggleReminder(r.id);
                if (!context.mounted) return;
                if (ok) await provider.loadReminders(vehicleId);
              },
            );
          },
        );
      },
    );
  }
}
