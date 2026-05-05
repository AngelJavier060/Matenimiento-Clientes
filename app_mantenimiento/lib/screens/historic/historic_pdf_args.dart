/// Argumentos opcionales para [HistoricPdfScreen].
class HistoricPdfArgs {
  /// Pre-rellena el filtro por placa de esa unidad (p. ej. desde Mantenimientos).
  final int? focusVehicleId;

  const HistoricPdfArgs({this.focusVehicleId});
}
