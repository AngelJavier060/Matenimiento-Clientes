import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/colors.dart';
import '../../models/reminder/reminder_response.dart';
import '../../models/vehicle/vehicle_response.dart';
import '../../providers/reminder_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../widgets/reminder_card.dart';
import '../maintenance/maintenance_form_screen.dart';

class ReminderListScreen extends StatefulWidget {
  const ReminderListScreen({super.key});

  @override
  State<ReminderListScreen> createState() => _ReminderListScreenState();
}

class _ReminderListScreenState extends State<ReminderListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int? _vehicleId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_syncTabLoad);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VehicleProvider>().loadVehicles();
      context.read<ReminderProvider>().loadDueReminders();
    });
  }

  void _syncTabLoad() {
    if (_tabController.indexIsChanging) return;
    final provider = context.read<ReminderProvider>();
    switch (_tabController.index) {
      case 0:
        provider.loadDueReminders();
        break;
      case 1:
        provider.loadUserReminders();
        break;
      case 2:
        if (_vehicleId != null) {
          provider.loadReminders(_vehicleId!);
        }
        break;
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_syncTabLoad);
    _tabController.dispose();
    super.dispose();
  }

  void _navigateMaintenance() {
    final preset = _tabController.index == 2 ? _vehicleId : null;
    Navigator.pushNamed(
      context,
      '/maintenance/form',
      arguments: MaintenanceFormArgs(initialVehicleId: preset),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = context.watch<VehicleProvider>().vehicles;

    final providerDue = context.select<ReminderProvider, List<ReminderResponse>>(
        (p) => p.dueReminders);

    final providerUser = context.select<ReminderProvider, List<ReminderResponse>>(
        (p) => p.userReminders);

    final providerVehicle =
        context.select<ReminderProvider, List<ReminderResponse>>(
            (p) => p.reminders);

    final loading =
        context.select<ReminderProvider, bool>((p) => p.isLoading);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recordatorios'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Por vencer', icon: Icon(Icons.timer_outlined)),
            Tab(text: 'Flota', icon: Icon(Icons.directions_car_outlined)),
            Tab(text: 'Por vehículo', icon: Icon(Icons.filter_alt_outlined)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateMaintenance,
        icon: const Icon(Icons.build_outlined),
        label: const Text('Mantenimiento'),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDueList(providerDue, loading),
          _buildFleetList(providerUser, loading),
          _buildVehicleTab(vehicles, providerVehicle, loading),
        ],
      ),
    );
  }

  Widget _wrapRefresh({required VoidCallback reload, required Widget child}) {
    return RefreshIndicator(
      onRefresh: () async {
        reload();
        await Future<void>.delayed(const Duration(milliseconds: 50));
      },
      child: child,
    );
  }

  Widget _buildDueList(List<ReminderResponse> list, bool loading) {
    return _wrapRefresh(
      reload: () =>
          context.read<ReminderProvider>().loadDueReminders(),
      child: loading && list.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : list.isEmpty
              ? _emptyPlaceholder(
                  Icons.notifications_active_outlined,
                  'Sin recordatorios próximos o vencidos',
                )
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(top: 8, bottom: 88),
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final r = list[i];
                    return ReminderCard(
                      reminder: r,
                      onTap: () {},
                      onDelete: () async {
                        await context.read<ReminderProvider>().deleteReminder(r.id);
                        if (mounted) {
                          await context.read<ReminderProvider>().loadDueReminders();
                        }
                      },
                      onToggleActive: () async {
                        await context.read<ReminderProvider>().toggleReminder(r.id);
                        if (mounted) {
                          await context.read<ReminderProvider>().loadDueReminders();
                        }
                      },
                    );
                  },
                ),
    );
  }

  Widget _buildFleetList(List<ReminderResponse> list, bool loading) {
    return _wrapRefresh(
      reload: () =>
          context.read<ReminderProvider>().loadUserReminders(),
      child: loading && list.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : list.isEmpty
              ? _emptyPlaceholder(
                  Icons.notifications_off_outlined,
                  'No hay recordatorios en la flota',
                )
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(top: 8, bottom: 88),
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final r = list[i];
                    return ReminderCard(
                      reminder: r,
                      onTap: () {},
                      onDelete: () async {
                        await context.read<ReminderProvider>().deleteReminder(r.id);
                        if (mounted) {
                          await context.read<ReminderProvider>().loadUserReminders();
                        }
                      },
                      onToggleActive: () async {
                        await context.read<ReminderProvider>().toggleReminder(r.id);
                        if (mounted) {
                          await context.read<ReminderProvider>().loadUserReminders();
                        }
                      },
                    );
                  },
                ),
    );
  }

  Widget _buildVehicleTab(
    List<VehicleResponse> vehicles,
    List<ReminderResponse> list,
    bool loading,
  ) {
    return Column(
      children: [
        if (vehicles.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: DropdownButtonFormField<int>(
              isExpanded: true,
              value: _vehicleId,
              decoration: const InputDecoration(
                labelText: 'Vehículo',
                prefixIcon:
                    Icon(Icons.directions_car_rounded, color: AppColors.accent),
              ),
              selectedItemBuilder: (ctx) => vehicles.map((v) {
                return Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    v.marcaPlacaLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              items: vehicles.map<DropdownMenuItem<int>>((v) {
                return DropdownMenuItem(
                  value: v.id,
                  child: Text(
                    v.marcaPlacaLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
              onChanged: (v) {
                setState(() => _vehicleId = v);
                if (v != null) {
                  context.read<ReminderProvider>().loadReminders(v);
                }
              },
            ),
          ),
        Expanded(
          child: _vehicleId == null
              ? _emptyPlaceholder(
                  Icons.notifications_active_rounded,
                  'Selecciona un vehículo para ver sus avisos',
                )
              : _wrapRefresh(
                  reload: () => context.read<ReminderProvider>().loadReminders(_vehicleId!),
                  child: loading && list.isEmpty
                      ? const Center(child: CircularProgressIndicator())
                      : list.isEmpty
                          ? _emptyPlaceholder(
                              Icons.notifications_off_rounded,
                              'Sin recordatorios para ese vehículo',
                            )
                          : ListView.builder(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.only(top: 8, bottom: 88),
                              itemCount: list.length,
                              itemBuilder: (_, i) {
                                final r = list[i];
                                final vid = _vehicleId!;
                                return ReminderCard(
                                  reminder: r,
                                  onTap: () {},
                                  onDelete: () async {
                                    await context
                                        .read<ReminderProvider>()
                                        .deleteReminder(r.id);
                                    if (mounted) {
                                      await context
                                          .read<ReminderProvider>()
                                          .loadReminders(vid);
                                    }
                                  },
                                  onToggleActive: () async {
                                    await context
                                        .read<ReminderProvider>()
                                        .toggleReminder(r.id);
                                    if (mounted) {
                                      await context
                                          .read<ReminderProvider>()
                                          .loadReminders(vid);
                                    }
                                  },
                                );
                              },
                            ),
                ),
        ),
      ],
    );
  }

  Widget _emptyPlaceholder(IconData icon, String msg) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 88),
      children: [
        SizedBox(
          height: 220,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 64, color: AppColors.textSecondary.withOpacity(0.3)),
              const SizedBox(height: 14),
              Text(
                msg,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
