import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/colors.dart';
import '../../models/maintenance/maintenance_response.dart';
import '../../models/vehicle/vehicle_response.dart';
import '../../providers/maintenance_provider.dart';
import '../../providers/vehicle_provider.dart';
import '../../utils/maintenance_category_filter.dart';
import '../../widgets/maintenance_card.dart';
import '../../widgets/preventive_plan_panel.dart';
import 'maintenance_form_screen.dart';

/// Listado tipo frontend: pestañas Correctivo / Preventivo, filtro `serviceCategory` + legacy en `tipo`.
class MaintenanceListScreen extends StatefulWidget {
  const MaintenanceListScreen({super.key});

  @override
  State<MaintenanceListScreen> createState() => _MaintenanceListScreenState();
}

class _MaintenanceListScreenState extends State<MaintenanceListScreen> {
  int? _selectedVehicleId;
  /// 0 = correctivo, 1 = preventivo (misma semántica que `?categoria=` en Angular).
  int _segment = 0;
  final GlobalKey<PreventivePlanPanelState> _preventiveReloadKey =
      GlobalKey<PreventivePlanPanelState>();

  /// Ver todos los mantenimientos de la unidad en pestaña Correctivo (filtro muy estricto).
  bool _bypassCorrectiveCategory = false;

  MaintenanceUiCategory get _category => _segment == 0
      ? MaintenanceUiCategory.corrective
      : MaintenanceUiCategory.preventive;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<VehicleProvider>().loadVehicles();
    });
  }

  Future<void> _reloadAfterSave(BuildContext ctx) async {
    final vid = _selectedVehicleId;
    if (vid == null) return;
    final mp = ctx.read<MaintenanceProvider>();
    await mp.loadMaintenances(vid);
    await _preventiveReloadKey.currentState?.reload();
  }

  Future<void> _refreshCurrent(BuildContext ctx) async {
    final vid = _selectedVehicleId;
    if (vid == null) return;
    await ctx.read<MaintenanceProvider>().loadMaintenances(vid);
    if (_segment == 1) {
      await _preventiveReloadKey.currentState?.reload();
    }
  }

  void _openForm() {
    if (_selectedVehicleId == null) return;
    final cat = _segment == 0 ? 'CORRECTIVE' : 'PREVENTIVE';

    Navigator.pushNamed(
      context,
      '/maintenance/form',
      arguments: MaintenanceFormArgs(
        initialVehicleId: _selectedVehicleId,
        defaultServiceCategory: cat,
      ),
    ).then((result) {
      if (!mounted || result != true) return;
      _reloadAfterSave(context);
    });
  }

  List<VehicleResponse> _ordenPlacasVinculadas(List<VehicleResponse> vs) {
    final list = vs
        .where(
            (v) => v.maintenancePlanId != null && v.maintenancePlanId! > 0)
        .toList();
    list.sort((a, b) {
      final pa = (a.licensePlate ?? '—').toLowerCase();
      final pb = (b.licensePlate ?? '—').toLowerCase();
      return pa.compareTo(pb);
    });
    return list;
  }

  PreferredSizeWidget _segmentBar(BuildContext context) {
    return PreferredSize(
      preferredSize: const Size(double.infinity, 46),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        child: SegmentedButton<int>(
          showSelectedIcon: false,
          style: SegmentedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 6),
          ),
          segments: [
            ButtonSegment<int>(
              value: 0,
              label: const Text('Correctivo'),
              icon:
                  Icon(Icons.handyman_outlined, size: Theme.of(context).iconTheme.size),
            ),
            ButtonSegment<int>(
              value: 1,
              label: const Text('Preventivo'),
              icon: Icon(Icons.calendar_month_outlined,
                  size: Theme.of(context).iconTheme.size),
            ),
          ],
          selected: {_segment},
          onSelectionChanged: (set) => setState(() {
                _segment = set.single;
                _bypassCorrectiveCategory = false;
              }),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = context.watch<VehicleProvider>().vehicles;
    final provider = context.watch<MaintenanceProvider>();
    final vid = _selectedVehicleId;
    final forVehicle = vid == null
        ? <MaintenanceResponse>[]
        : provider.maintenances.where((m) => m.vehicleId == vid).toList();

    final displayed = (_segment == 0 && _bypassCorrectiveCategory)
        ? forVehicle
        : forVehicle
            .where((m) => maintenanceMatchesUiCategory(m, _category))
            .toList();
    final vinculos = _ordenPlacasVinculadas(vehicles);

    return Scaffold(
      appBar: AppBar(
        title: Text(_segment == 0
            ? 'Mantenimientos · Correctivo'
            : 'Mantenimientos · Preventivo'),
        bottom: _segmentBar(context),
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: _segment == 0
            ? 'Nuevo mantenimiento correctivo'
            : 'Nuevo mantenimiento preventivo',
        onPressed: _selectedVehicleId == null ? null : _openForm,
        child: const Icon(Icons.add_rounded),
      ),
      body: Column(
        children: [
          if (vehicles.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: DropdownButtonFormField<int>(
                isExpanded: true,
                value: _selectedVehicleId,
                decoration: const InputDecoration(
                  labelText: 'Seleccionar vehículo',
                  prefixIcon:
                      Icon(Icons.directions_car_rounded, color: AppColors.accent),
                  filled: true,
                  fillColor: AppColors.backgroundLight,
                ),
                selectedItemBuilder: (ctx) =>
                    vehicles.map((v) {
                      return Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          v.marcaPlacaLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                items: vehicles.map((v) {
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
                  setState(() {
                    _selectedVehicleId = v;
                    _bypassCorrectiveCategory = false;
                  });
                  if (v != null) {
                    provider.loadMaintenances(v);
                  }
                },
              ),
            ),
          if (_selectedVehicleId != null &&
              provider.error != null &&
              !provider.isLoading)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Material(
                color: AppColors.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.error_outline_rounded,
                          color: AppColors.error, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          provider.error!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontSize: 13,
                            height: 1.35,
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: () => _refreshCurrent(context),
                        child: const Text('Reintentar'),
                      ),
                    ],
                  ),
                ),
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
                : provider.isLoading && forVehicle.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : _segment == 0
                        ? _buildCorrectiveList(provider, displayed, forVehicle)
                        : _buildPreventiveBody(
                            context, provider, displayed, vinculos),
          ),
        ],
      ),
    );
  }

  Widget _buildCorrectiveList(
    MaintenanceProvider provider,
    List<MaintenanceResponse> displayed,
    List<MaintenanceResponse> forVehicle,
  ) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (forVehicle.isEmpty && provider.error == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.handyman_outlined,
                  size: 64,
                  color: AppColors.textSecondary.withOpacity(0.3)),
              const SizedBox(height: 12),
              const Text(
                'Sin mantenimientos registrados para esta unidad',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }
    if (forVehicle.isEmpty && provider.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded,
                  size: 56, color: AppColors.textSecondary),
              const SizedBox(height: 14),
              Text(
                provider.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.error),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => _refreshCurrent(context),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }
    if (displayed.isEmpty && forVehicle.isNotEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.filter_alt_off_rounded,
                  size: 64,
                  color: AppColors.textSecondary.withOpacity(0.35)),
              const SizedBox(height: 12),
              Text(
                'Hay ${forVehicle.length} registro(s) para esta placa,\n'
                'pero ninguno aparece como correctivo ni mixto en el filtro actual.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary.withOpacity(0.95)),
              ),
              const SizedBox(height: 16),
              FilledButton.tonalIcon(
                onPressed: () => setState(() => _bypassCorrectiveCategory = true),
                icon: const Icon(Icons.list_alt_rounded),
                label: Text('Mostrar todos (${forVehicle.length})'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _refreshCurrent(context),
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 88),
        itemCount: displayed.length,
        itemBuilder: (context, index) {
          final m = displayed[index];
          return MaintenanceCard(
            maintenance: m,
            onTap: () {},
            onDelete: () =>
                provider.deleteMaintenance(m.id, _selectedVehicleId!),
          );
        },
      ),
    );
  }

  Widget _buildPreventiveBody(
    BuildContext context,
    MaintenanceProvider provider,
    List<MaintenanceResponse> displayed,
    List<VehicleResponse> vinculos,
  ) {
    return RefreshIndicator(
      onRefresh: () => _refreshCurrent(context),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 96),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PreventivePlanPanel(
              key: _preventiveReloadKey,
              shrinkWrapped: true,
              vehicleId: _selectedVehicleId!,
            ),
            if (vinculos.length > 1)
              ExpansionTile(
                initiallyExpanded: false,
                tilePadding:
                    const EdgeInsets.symmetric(horizontal: 16),
                title: Row(
                  children: [
                    const Icon(Icons.directions_car_filled_rounded,
                        size: 20, color: AppColors.accent),
                    const SizedBox(width: 10),
                    Text(
                      'Placas con plan en ficha (${vinculos.length})',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                subtitle: const Text(
                  'Sólo unidades que tienen plan guardado en la ficha. Pulse para seleccionar otra.',
                  style:
                      TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                children: [
                  for (final v in vinculos)
                    ListTile(
                      dense: true,
                      title: Text(
                        '${v.licensePlate ?? 'Sin placa'} · ${v.brand} ${v.model}',
                      ),
                      trailing: _selectedVehicleId == v.id
                          ? Icon(Icons.check_circle,
                              color: AppColors.success, size: 20)
                          : null,
                      onTap: provider.isLoading
                          ? null
                          : () {
                          setState(() {
                            _selectedVehicleId = v.id;
                            _bypassCorrectiveCategory = false;
                          });
                          provider.loadMaintenances(v.id);
                        },
                    ),
                ],
              ),
            if (provider.isLoading && displayed.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text(
                'Historial (preventivo y mixtos)',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            if (!provider.isLoading && displayed.isEmpty)
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Text(
                  'No hay registros preventivos ni mixtos en esta unidad.',
                  style: TextStyle(color: AppColors.textSecondary.withOpacity(0.9)),
                ),
              )
            else
              ...displayed.map(
                (m) => MaintenanceCard(
                  maintenance: m,
                  onTap: () {},
                  onDelete: () =>
                      provider.deleteMaintenance(m.id, _selectedVehicleId!),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
