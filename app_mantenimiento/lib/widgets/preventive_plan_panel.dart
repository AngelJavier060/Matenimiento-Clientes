import 'package:flutter/material.dart';

import '../config/colors.dart';
import '../models/maintenance_plan/maintenance_plan_activity_response.dart';
import '../models/maintenance_plan/vehicle_maintenance_plan_match_response.dart';
import '../services/maintenance_plan_service.dart';

/// Libro/resolución MMY (misma idea que pestaña Preventivo del frontend / ficha).
class PreventivePlanPanel extends StatefulWidget {
  final int vehicleId;
  final bool shrinkWrapped;

  const PreventivePlanPanel({
    super.key,
    required this.vehicleId,
    this.shrinkWrapped = false,
  });

  @override
  State<PreventivePlanPanel> createState() => PreventivePlanPanelState();
}

class PreventivePlanPanelState extends State<PreventivePlanPanel> {
  final MaintenancePlanService _planService = MaintenancePlanService();

  VehicleMaintenancePlanMatchResponse? _match;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant PreventivePlanPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.vehicleId != widget.vehicleId) {
      _load();
    }
  }

  Future<void> reload() => _load();

  Future<void> _load() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      _match = await _planService.resolveForVehicle(widget.vehicleId);
    } catch (e) {
      _match = null;
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _incorporateTemplate() async {
    setState(() => _busy = true);
    try {
      await _planService.incorporatePreventiveFromTemplate(widget.vehicleId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text('Actividades MMY sincronizadas con esta placa.')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _activityTile(MaintenancePlanActivityResponse a) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: ListTile(
        title: Text(a.nombre,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${a.intervaloKm != null ? "${a.intervaloKm} km" : "—"} · '
          '${a.intervaloMeses != null ? "${a.intervaloMeses} meses" : "—"} · tipo ${a.tipo}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: a.clonedFromPlanActivityId != null
            ? const Icon(Icons.library_add_check,
                size: 20, color: AppColors.success)
            : null,
      ),
    );
  }

  /// Contenido resuelto: encabezado + actividades (si hay).
  List<Widget> _buildColumnChildren(
    VehicleMaintenancePlanMatchResponse m,
  ) {
    final plan = m.plan!;
    final acts = plan.activities ?? [];
    final lastKm = m.lastServiceMileage;
    final lastDate = m.lastServiceDate ?? '-';

    return [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(
                  label: Text(
                      m.matchMode == 'FIXED' ? 'Plan fijo' : 'Emparejo MMY'),
                  backgroundColor: AppColors.accent.withOpacity(0.12),
                ),
              ],
            ),
            if ((m.hint ?? '').trim().isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                m.hint!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              plan.summary,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Último mantenimiento: ${lastKm != null ? '${lastKm} km' : '—'} · fecha $lastDate',
              style: const TextStyle(
                  fontSize: 13, color: AppColors.textSecondary),
            ),
            Text(
              'Compromiso ficha: ${m.nextCommittedServiceMileage ?? '—'} km · fecha ${m.nextCommittedServiceDate ?? '—'}',
              style: const TextStyle(
                  fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _busy ? null : _incorporateTemplate,
                icon: const Icon(Icons.file_copy_outlined, size: 20),
                label: const Text(
                    'Traer líneas MMY que falten para esta placa'),
              ),
            ),
          ],
        ),
      ),
      const Divider(height: 28),
      if (acts.isEmpty)
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'Sin actividades en la vista resuelta. Use “Traer líneas…” para copiar desde la plantilla MMY cuando exista.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        )
      else
        ...acts.map(_activityTile),
    ];
  }

  Widget _buildBody() {
    if (_busy && _match == null) {
      return const Padding(
        padding: EdgeInsets.all(48),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    final m = _match;
    if (m == null) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          _error ?? 'No se pudo resolver el plan preventivo.',
          style: TextStyle(
            color:
                _error != null ? AppColors.error : AppColors.textSecondary,
            height: 1.35,
          ),
        ),
      );
    }

    if (m.matchMode == 'NONE' || m.plan == null) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          m.hint ?? 'Sin plan MMY ni plan fijo para esta unidad.',
          style: const TextStyle(
              color: AppColors.textSecondary, height: 1.35),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: _buildColumnChildren(m),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Widget core = AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: _buildBody(),
    );

    if (widget.shrinkWrapped) {
      return Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 8),
          child: core,
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 12, bottom: 80),
        child: core,
      ),
    );
  }
}
