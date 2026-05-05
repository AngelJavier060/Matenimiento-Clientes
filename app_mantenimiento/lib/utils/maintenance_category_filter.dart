import '../models/maintenance/maintenance_response.dart';

/// Equivalente al filtro `categoria` del frontend (/maintenance?categoria=correctivo|preventivo).
enum MaintenanceUiCategory {
  corrective,
  preventive,
}

bool _matchesCategoriaLegacy(String? serviceType, MaintenanceUiCategory cat) {
  final t = (serviceType ?? '').trim().toLowerCase();
  if (t.isEmpty) return false;

  switch (cat) {
    case MaintenanceUiCategory.corrective:
      return t.contains('correct') ||
          t == 'correctivo' ||
          t.contains('mantenimiento correctivo') ||
          t.contains('emergencia');
    case MaintenanceUiCategory.preventive:
      return t.contains('prevent') ||
          t == 'preventivo' ||
          t.contains('mantenimiento preventivo');
  }
}

/// Unifica inglés/español que pueda llegar desde el backend o registros antiguos.
String? normalizedServiceCategoryKey(String? raw) {
  if (raw == null) return null;
  final u = raw.trim().toUpperCase();
  if (u.isEmpty) return null;

  switch (u) {
    case 'CORRECTIVE':
    case 'CORRECTIVO':
      return 'CORRECTIVE';
    case 'PREVENTIVE':
    case 'PREVENTIVO':
      return 'PREVENTIVE';
    case 'MIXED':
    case 'MIXTO':
      return 'MIXED';
    default:
      break;
  }

  // Valores truncados en VARCHAR, typos u otras variantes.
  if (u.startsWith('CORREC') || u.contains('CORRECT')) {
    return 'CORRECTIVE';
  }
  if (u.startsWith('PREVEN') || u.contains('PREVENT')) {
    return 'PREVENTIVE';
  }
  if (u.contains('MIX')) {
    return 'MIXED';
  }

  return null;
}

bool maintenanceMatchesUiCategory(
  MaintenanceResponse m,
  MaintenanceUiCategory cat,
) {
  final canon = normalizedServiceCategoryKey(m.serviceCategory);

  if (canon == 'MIXED') {
    return true;
  }
  if (cat == MaintenanceUiCategory.preventive && canon == 'PREVENTIVE') {
    return true;
  }
  if (cat == MaintenanceUiCategory.corrective && canon == 'CORRECTIVE') {
    return true;
  }

  // Otra etiqueta conocida pero opuesta a esta pestaña: no mezclar con legacy.
  if (canon == 'PREVENTIVE' || canon == 'CORRECTIVE') {
    return false;
  }

  // Vacío / desconocido: inferencia por texto del tipo (registros viejos o APIs raras).
  return _matchesCategoriaLegacy(m.serviceType, cat);
}

/// Etiquetas tipo chip (inglés/español unificado).
String maintenanceCategoryLabel(String? cat) {
  switch (normalizedServiceCategoryKey(cat) ?? '') {
    case 'PREVENTIVE':
      return 'Preventivo';
    case 'CORRECTIVE':
      return 'Correctivo';
    case 'MIXED':
      return 'Mixto';
    default:
      return '';
  }
}
