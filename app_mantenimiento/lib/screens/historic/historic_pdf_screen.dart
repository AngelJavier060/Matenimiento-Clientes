import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';

import '../../config/colors.dart';
import '../../providers/vehicle_provider.dart';
import '../../services/maintenance_service.dart';
import '../../services/reminder_service.dart';
import '../../utils/maintenance_history_pdf.dart';
import '../../models/vehicle/vehicle_response.dart';
import 'historic_pdf_args.dart';

/// Listado «Histórico»: generar PDF y abrirlo en vista previa (PdfPreview).
class HistoricPdfScreen extends StatefulWidget {
  const HistoricPdfScreen({super.key});

  @override
  State<HistoricPdfScreen> createState() => _HistoricPdfScreenState();
}

class _HistoricPdfScreenState extends State<HistoricPdfScreen> {
  final MaintenanceService _maintenanceService = MaintenanceService();
  final ReminderService _reminderService = ReminderService();
  final TextEditingController _filterController = TextEditingController();

  int? _pdfLoadingVehicleId;

  /// Desde rutas tipo [HistoricPdfArgs]: pre-rellenar filtro por placa.
  int? _pendingFocusVehicleId;
  bool _focusAppliedFromArgs = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final a = ModalRoute.of(context)?.settings.arguments;
    if (a is HistoricPdfArgs &&
        _pendingFocusVehicleId == null &&
        a.focusVehicleId != null) {
      _pendingFocusVehicleId = a.focusVehicleId;
    }
  }

  void _applyArgsVehicleFocus(List<VehicleResponse> vehicles) {
    if (_focusAppliedFromArgs || _pendingFocusVehicleId == null) return;
    if (vehicles.isEmpty) return;

    VehicleResponse? v;
    try {
      v = vehicles.firstWhere((x) => x.id == _pendingFocusVehicleId);
    } catch (_) {
      _focusAppliedFromArgs = true;
      return;
    }

    final plate = v.licensePlate?.trim();
    final txt =
        plate != null && plate.isNotEmpty ? plate : v.marcaPlacaLabel;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() {
        _filterController.text = txt;
        _focusAppliedFromArgs = true;
      });
    });
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<VehicleProvider>().loadVehicles();
    });
  }

  @override
  void dispose() {
    _filterController.dispose();
    super.dispose();
  }

  Future<void> _downloadPdf(VehicleResponse vehicle) async {
    if (_pdfLoadingVehicleId != null) return;
    setState(() => _pdfLoadingVehicleId = vehicle.id);

    try {
      await initializeDateFormatting('es_ES');
      final maintenances =
          await _maintenanceService.getMaintenancesByVehicle(vehicle.id);
      final reminders =
          await _reminderService.getRemindersByVehicle(vehicle.id);

      final next = buildNextServicesPdf(vehicle, reminders);
      final dateStr =
          DateTime.now().toUtc().toIso8601String().substring(0, 10).replaceAll('-', '');
      final reportId = '#MHR-${vehicle.id}-$dateStr';
      final generatedLabel = DateFormat.yMMMMd('es_ES').add_jm().format(DateTime.now());

      final pdfBytes = await generateMaintenanceHistoryPdf(
        vehicle: vehicle,
        maintenances: maintenances,
        nextServices: next,
        reportId: reportId,
        generatedLabel: generatedLabel,
      );

      final rawPlate =
          vehicle.licensePlate?.trim().isNotEmpty == true ? vehicle.licensePlate!.trim() : 'unidad';
      final fname =
          'historico_${sanitizeHistoryPdfPlate(rawPlate)}_${vehicle.id}.pdf';

      if (!mounted) return;
      await Navigator.of(context).push<void>(
        MaterialPageRoute<void>(
          builder: (ctx) => Scaffold(
            appBar: AppBar(
              title: Text(vehicle.marcaPlacaLabel),
            ),
            body: PdfPreview(
              build: (_) async => pdfBytes,
              pdfFileName: fname,
            ),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              e.toString().replaceFirst('Exception: ', 'No se pudo generar el PDF. ')),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _pdfLoadingVehicleId = null);
    }
  }

  List<VehicleResponse> _filtered(List<VehicleResponse> vehicles) {
    final q = _filterController.text.trim().toLowerCase();
    if (q.isEmpty) return vehicles;
    return vehicles.where((v) => (v.licensePlate ?? '').toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final vehicles = context.watch<VehicleProvider>().vehicles;
    final loading = context.watch<VehicleProvider>().isLoading;
    _applyArgsVehicleFocus(vehicles);

    final sorted = [...vehicles]..sort((a, b) =>
        (a.licensePlate ?? '')
            .toLowerCase()
            .compareTo((b.licensePlate ?? '').toLowerCase()));
    final shown = _filtered(sorted);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial · PDF'),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Informe PDF del historial por unidad: toca una fila para verlo '
                  'en pantalla (zoom y desplazamiento). También puede imprimir o '
                  'compartir desde la barra del visor.',
                  style:
                      TextStyle(fontSize: 13, height: 1.35, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _filterController,
                  decoration: const InputDecoration(
                    labelText: 'Filtrar por placa',
                    prefixIcon:
                        Icon(Icons.search_rounded, color: AppColors.accent),
                    filled: true,
                    fillColor: AppColors.backgroundLight,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ],
            ),
          ),
          Expanded(
            child: loading && vehicles.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : shown.isEmpty
                    ? Center(
                        child: Text(
                          vehicles.isEmpty
                              ? 'No hay vehículos cargados.'
                              : 'Sin coincidencias con el filtro.',
                          style:
                              TextStyle(color: AppColors.textSecondary.withOpacity(0.9)),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            context.read<VehicleProvider>().loadVehicles(),
                        child: ListView.separated(
                          padding:
                              const EdgeInsets.fromLTRB(16, 0, 16, 24),
                          itemCount: shown.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 6),
                          itemBuilder: (context, i) {
                            final v = shown[i];
                            final busy =
                                _pdfLoadingVehicleId == v.id;

                            return Card(
                              margin: EdgeInsets.zero,
                              child: ListTile(
                                leading: Icon(
                                  Icons.directions_car_rounded,
                                  color: AppColors.accent.withOpacity(0.9),
                                ),
                                title: Text(
                                  v.marcaPlacaLabel,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600),
                                ),
                                subtitle: Text(
                                  '${v.brand} ${v.model} · ${v.year}',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary),
                                ),
                                trailing: IconButton(
                                  tooltip: 'Ver informe PDF',
                                  icon: busy
                                      ? const SizedBox(
                                          width: 22,
                                          height: 22,
                                          child:
                                              CircularProgressIndicator(strokeWidth: 2))
                                      : Icon(
                                          Icons.picture_as_pdf_rounded,
                                          color:
                                              Theme.of(context).colorScheme.secondary,
                                        ),
                                  onPressed: busy ||
                                          _pdfLoadingVehicleId != null
                                      ? null
                                      : () => _downloadPdf(v),
                                ),
                                onTap: busy || _pdfLoadingVehicleId != null
                                    ? null
                                    : () => _downloadPdf(v),
                              ),
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
