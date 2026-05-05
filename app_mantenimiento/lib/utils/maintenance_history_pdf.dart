import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/maintenance/maintenance_response.dart';
import '../models/reminder/reminder_response.dart';
import '../models/vehicle/vehicle_response.dart';
import 'maintenance_category_filter.dart';
import 'vehicle_image_url.dart';

class HistoryReportNextService {
  final String label;
  final int? km;

  const HistoryReportNextService({required this.label, this.km});
}

List<HistoryReportNextService> buildNextServicesPdf(
  VehicleResponse vehicle,
  List<ReminderResponse> reminders,
) {
  final out = <HistoryReportNextService>[];
  final ckm = vehicle.nextCommittedServiceMileage;
  if (ckm != null && ckm > 0) {
    out.add(HistoryReportNextService(
      label: 'Proximo servicio comprometido',
      km: ckm,
    ));
  }

  final active = reminders.where((r) {
    final km = r.thresholdMileage;
    return r.isActive && km != null && km > 0;
  }).toList()
    ..sort((a, b) =>
        (a.thresholdMileage ?? 0).compareTo(b.thresholdMileage ?? 0));

  for (final r in active) {
    final km = r.thresholdMileage;
    final label = r.title.trim().isEmpty ? 'Recordatorio' : r.title.trim();
    final dup = out.any(
        (o) => o.km == km && o.label.toLowerCase() == label.toLowerCase());
    if (dup) continue;
    out.add(HistoryReportNextService(label: label, km: km));
    if (out.length >= 6) break;
  }

  if (out.length > 3) {
    return out.sublist(0, 3);
  }
  return out;
}

int _serviceDateTs(String? d) {
  if (d == null || d.isEmpty) return 0;
  return DateTime.tryParse(d.contains('T') ? d : '${d}T12:00:00')
          ?.millisecondsSinceEpoch ??
      0;
}

String _formatIsoDate(String? d) {
  if (d == null || d.isEmpty) return '—';
  if (d.contains('T')) {
    return d.length >= 10 ? d.substring(0, 10) : d;
  }
  return d.length >= 10 ? d.substring(0, 10) : d;
}

String _fmtKm(int n) =>
    '${NumberFormat.decimalPattern('es').format(n)} km';

String _costLabel(double? c) {
  if (c == null) return '—';
  return NumberFormat.currency(
    locale: 'es_ES',
    symbol: r'$',
    decimalDigits: 2,
  ).format(c);
}

String _pdfTypeLabel(MaintenanceResponse m) {
  final l = maintenanceCategoryLabel(m.serviceCategory);
  if (l.isNotEmpty) return l;
  return m.serviceType.isEmpty ? '—' : m.serviceType;
}

List<String> _activities(MaintenanceResponse m) {
  final performed = (m.lineItems ?? [])
      .where((li) =>
          (li.lineType ?? '').toUpperCase() == 'PERFORMED' &&
          ((li.description ?? '').trim().isNotEmpty))
      .map((e) => e.description!.trim())
      .toList();
  if (performed.isNotEmpty) return performed;
  final desc = m.description?.trim();
  if (desc != null && desc.isNotEmpty) {
    return desc
        .split('\n')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
  }
  final lbl = _pdfTypeLabel(m);
  return lbl == '—' ? ['Mantenimiento'] : [lbl];
}

bool _isPreventive(MaintenanceResponse m) =>
    (normalizedServiceCategoryKey(m.serviceCategory) ?? '') == 'PREVENTIVE';

double _totalCost(List<MaintenanceResponse> list) =>
    list.fold<double>(0, (s, m) => s + (m.cost ?? 0));

Future<pw.MemoryImage?> _vehiclePhotoMemoryImage(String? imageUrl) async {
  final resolved = VehicleImageUrl.resolve(imageUrl);
  if (resolved == null) return null;
  try {
    final r =
        await http.get(Uri.parse(resolved)).timeout(const Duration(seconds: 20));
    if (r.statusCode != 200 || r.bodyBytes.isEmpty) return null;
    return pw.MemoryImage(r.bodyBytes);
  } catch (_) {
    return null;
  }
}

/// Informe histórico (equivalente al PDF del frontend vía Angular + jsPDF).
Future<Uint8List> generateMaintenanceHistoryPdf({
  required VehicleResponse vehicle,
  required List<MaintenanceResponse> maintenances,
  required List<HistoryReportNextService> nextServices,
  required String reportId,
  required String generatedLabel,
}) async {
  await initializeDateFormatting('es_ES');
  final base = await PdfGoogleFonts.openSansRegular();
  final bold = await PdfGoogleFonts.openSansBold();
  final photoMem = await _vehiclePhotoMemoryImage(vehicle.imageUrl);

  final sorted = [...maintenances]
    ..sort((a, b) =>
        _serviceDateTs(b.serviceDate).compareTo(_serviceDateTs(a.serviceDate)));

  final doc = pw.Document(
    theme: pw.ThemeData.withFont(base: base, bold: bold),
  );

  final plate = vehicle.licensePlate?.trim() ?? '—';
  final estadoOk = vehicle.isActive;
  final total = _totalCost(maintenances);

  doc.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(36),
      build: (context) => [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'Mantenimiento Vehicular',
                  style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold, fontSize: 14),
                ),
                pw.SizedBox(height: 4),
                pw.Text('Informe · historico',
                    style:
                        const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                pw.SizedBox(height: 8),
                pw.Text(
                  'Resumen de intervenciones registradas en el sistema.',
                  style: const pw.TextStyle(fontSize: 9),
                ),
              ],
            ),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text(
                  'Informe historico de mantenimiento',
                  style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold, fontSize: 12),
                ),
                pw.SizedBox(height: 4),
                pw.Text('ID: $reportId',
                    style: const pw.TextStyle(fontSize: 9)),
                pw.Text('Generado: $generatedLabel',
                    style: const pw.TextStyle(fontSize: 9)),
              ],
            ),
          ],
        ),
        pw.Divider(thickness: 1),
        pw.SizedBox(height: 12),
        pw.Text(
          'Resumen del vehiculo',
          style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11),
        ),
        pw.SizedBox(height: 8),
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            if (photoMem != null) ...[
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Container(
                    width: 132,
                    height: 94,
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(
                          color: PdfColors.grey400, width: 0.7),
                      borderRadius: pw.BorderRadius.circular(6),
                      color: PdfColors.grey100,
                    ),
                    child: pw.ClipRRect(
                      horizontalRadius: 5,
                      verticalRadius: 5,
                      child: pw.Image(
                        photoMem,
                        fit: pw.BoxFit.cover,
                        width: 132,
                        height: 94,
                      ),
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Foto de la unidad',
                    style: const pw.TextStyle(
                      fontSize: 7,
                      color: PdfColors.grey700,
                    ),
                  ),
                ],
              ),
              pw.SizedBox(width: 14),
            ],
            pw.Expanded(
              child: pw.Table(
                border: pw.TableBorder.all(
                    color: PdfColors.grey300, width: 0.6),
                children: [
                  pw.TableRow(
                    decoration:
                        const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      _cellHeader('Placa'),
                      _cellHeader('Marca / modelo'),
                      _cellHeader('Ano'),
                      _cellHeader('Km actual'),
                      _cellHeader('Estado'),
                    ],
                  ),
                  pw.TableRow(
                    children: [
                      _cellData(plate),
                      _cellData(
                          '${vehicle.brand} ${vehicle.model}'.trim()),
                      _cellData('${vehicle.year}'),
                      _cellData(vehicle.mileage != null
                          ? _fmtKm(vehicle.mileage!)
                          : '—'),
                      _cellData(estadoOk ? 'Operativo' : 'Inactivo'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 16),
        pw.Text(
          'Registro de actividades',
          style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11),
        ),
        pw.SizedBox(height: 8),
        if (sorted.isEmpty)
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey400),
              borderRadius: pw.BorderRadius.circular(4),
            ),
            child: pw.Text(
              'No hay mantenimientos registrados para esta unidad.',
              style: const pw.TextStyle(fontSize: 9),
            ),
          )
        else
          pw.Table(
            columnWidths: {
              0: const pw.FixedColumnWidth(64),
              1: const pw.FixedColumnWidth(56),
              2: const pw.FixedColumnWidth(72),
              3: const pw.FlexColumnWidth(),
              4: const pw.FixedColumnWidth(58),
            },
            border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                children: [
                  _cellHeader('Fecha'),
                  _cellHeader('Tipo'),
                  _cellHeader('Taller'),
                  _cellHeader('Actividades'),
                  _cellHeader('Importe', right: true),
                ],
              ),
              ...sorted.map((m) {
                final taller = () {
                  final n = (m.workshopName ?? '').trim();
                  final a = (m.workshopAddress ?? '').trim();
                  if (n.isNotEmpty) return n;
                  if (a.isNotEmpty) return a;
                  return '—';
                }();

                final actText = _activities(m).take(14).join(' · ');
                final badgePrev = _isPreventive(m);
                final tipo = pw.Container(
                  padding: const pw.EdgeInsets.symmetric(
                      horizontal: 4, vertical: 2),
                  decoration: pw.BoxDecoration(
                    color:
                        badgePrev ? PdfColors.lightBlue50 : PdfColors.orange50,
                    borderRadius: pw.BorderRadius.circular(3),
                  ),
                  child: pw.Text(
                    _pdfTypeLabel(m),
                    style: pw.TextStyle(
                      fontSize: 8,
                      color:
                          badgePrev ? PdfColors.blue900 : PdfColors.orange900,
                    ),
                  ),
                );
                return pw.TableRow(
                  verticalAlignment: pw.TableCellVerticalAlignment.top,
                  children: [
                    _cellTop(_formatIsoDate(m.serviceDate)),
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(6),
                      child: tipo,
                    ),
                    _cellTop(taller),
                    _cellTop(actText),
                    _cellTop(_costLabel(m.cost), right: true),
                  ],
                );
              }),
            ],
          ),
        if (sorted.isNotEmpty) ...[
          pw.SizedBox(height: 14),
          pw.Text(
            'Detalle reciente',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
          ),
          pw.SizedBox(height: 8),
          pw.Wrap(
            spacing: 10,
            runSpacing: 10,
            children: sorted.take(3).map((m) {
              final acts = _activities(m);
              final title = acts.first;
              return pw.Container(
                width: 148,
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.blue100),
                  color: PdfColors.blue50,
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      title,
                      maxLines: 2,
                      style: pw.TextStyle(
                          fontWeight: pw.FontWeight.bold, fontSize: 8),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(_formatIsoDate(m.serviceDate),
                        style: const pw.TextStyle(fontSize: 8)),
                    pw.Text(
                      m.mileageAtService != null
                          ? 'En ${_fmtKm(m.mileageAtService!)}'
                          : '—',
                      style: const pw.TextStyle(fontSize: 8),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
        pw.SizedBox(height: 14),
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Container(
                padding: const pw.EdgeInsets.all(14),
                decoration: pw.BoxDecoration(
                  color: PdfColors.teal800,
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'INVERSION TOTAL REGISTRADA',
                      style: pw.TextStyle(color: PdfColors.white, fontSize: 8),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      _costLabel(total),
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontWeight: pw.FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    pw.SizedBox(height: 6),
                    pw.Text(
                      'Suma de costes de los registros mostrados',
                      style: const pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 7,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            pw.SizedBox(width: 14),
            pw.Expanded(
              child: pw.Container(
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey400),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Proximos hitos (recordatorios / km)',
                      style: pw.TextStyle(
                        fontWeight: pw.FontWeight.bold,
                        fontSize: 9,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    if (nextServices.isEmpty)
                      pw.Text(
                        'Sin recordatorios con umbral de km para esta unidad.',
                        style:
                            const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      )
                    else
                      pw.Column(
                        children: nextServices.map((n) {
                          return pw.Padding(
                            padding: const pw.EdgeInsets.only(bottom: 6),
                            child: pw.Row(
                              mainAxisAlignment:
                                  pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Expanded(
                                  child: pw.Text(
                                    n.label,
                                    style: const pw.TextStyle(fontSize: 8),
                                  ),
                                ),
                                pw.Text(
                                  n.km != null ? _fmtKm(n.km!) : '—',
                                  style: const pw.TextStyle(fontSize: 8),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 20),
        pw.Divider(color: PdfColors.grey400),
        pw.SizedBox(height: 8),
        pw.Text(
          'PLATAFORMA DE MANTENIMIENTO · DOCUMENTO GENERADO ELECTRONICAMENTE\n'
          'Los datos reflejan el estado del sistema en la fecha de generacion.',
          textAlign: pw.TextAlign.center,
          style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
        ),
      ],
    ),
  );

  return doc.save();
}

pw.Widget _cellHeader(String text, {bool right = false}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.all(6),
    child: pw.Text(
      text,
      textAlign: right ? pw.TextAlign.right : pw.TextAlign.left,
      style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9),
    ),
  );
}

pw.Widget _cellData(String text) {
  return pw.Padding(
    padding: const pw.EdgeInsets.all(8),
    child: pw.Text(text, style: const pw.TextStyle(fontSize: 9)),
  );
}

pw.Widget _cellTop(String text, {bool right = false}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.all(6),
    child: pw.Text(
      text,
      textAlign: right ? pw.TextAlign.right : pw.TextAlign.left,
      style: const pw.TextStyle(fontSize: 8),
      maxLines: 10,
    ),
  );
}

String sanitizeHistoryPdfPlate(String plate) =>
    plate.replaceAll(RegExp(r'[^\w-]+'), '_');
