import '../config/api_config.dart';

/// Convierte `imageUrl` del API (relativa tipo `/uploads/vehicles/...`) en URL lista para `Image.network`.
class VehicleImageUrl {
  VehicleImageUrl._();

  /// `null` si no hay valor útil para mostrar.
  static String? resolve(String? imageUrl) {
    if (imageUrl == null) return null;
    final t = imageUrl.trim();
    if (t.isEmpty) return null;
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    if (t.startsWith('/')) return '${ApiConfig.httpOrigin}$t';
    return t;
  }

  static bool canLoadNetwork(String? imageUrl) {
    final u = resolve(imageUrl);
    return u != null &&
        (u.startsWith('http://') || u.startsWith('https://'));
  }
}
