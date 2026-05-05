import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

/// Decodifica respuestas JSON del backend (`List`, `Map` o envuelto en `content`).
class ApiPayload {
  ApiPayload._();

  static List<Map<String, dynamic>> decodeList(dynamic data) {
    if (data == null) return [];
    if (data is List) {
      return data
          .where((e) => e is Map)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    if (data is Map<String, dynamic>) {
      final c = data['content'];
      if (c is List) return decodeList(c);
    }
    return [];
  }

  static Map<String, dynamic> decodeMap(dynamic data) {
    if (data == null || data is! Map) return {};
    return Map<String, dynamic>.from(data);
  }
}

class ApiService {
  static const String _tokenKey = 'auth_token';
  /// Evita esperas indefinidas si el servidor no es alcanzable.
  static const Duration _timeout = Duration(seconds: 22);

  static String _timeoutMessage() =>
      'Tiempo agotado al hablar con el servidor (${ApiConfig.baseUrl}). '
      'Comprueba que Spring esté ejecutándose y sea accesible desde este equipo. '
      'En teléfono físico ejecuta flutter con '
      '`--dart-define=API_BASE_URL=http://TU_IP_LOCAL:8080/api`.';

  static Future<http.Response> _withNetwork(Future<http.Response> pending) async {
    try {
      return await pending.timeout(_timeout);
    } on TimeoutException {
      throw Exception(_timeoutMessage());
    } on SocketException {
      throw Exception(
          'No se pudo conectar a ${ApiConfig.baseUrl}. Comprueba red, firewall y la URL.');
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static Future<dynamic> get(String endpoint, {bool auth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await _withNetwork(
      http.get(url, headers: await _headers(auth: auth)),
    );
    return _handleResponse(response);
  }

  static Future<dynamic> post(String endpoint,
      {Map<String, dynamic>? body, bool auth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await _withNetwork(http.post(
      url,
      headers: await _headers(auth: auth),
      body: body != null ? jsonEncode(body) : null,
    ));
    return _handleResponse(response);
  }

  static Future<dynamic> put(String endpoint,
      {Map<String, dynamic>? body, bool auth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await _withNetwork(http.put(
      url,
      headers: await _headers(auth: auth),
      body: body != null ? jsonEncode(body) : null,
    ));
    return _handleResponse(response);
  }

  static Future<dynamic> patch(String endpoint,
      {Map<String, dynamic>? body, bool auth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await _withNetwork(http.patch(
      url,
      headers: await _headers(auth: auth),
      body: body != null ? jsonEncode(body) : null,
    ));
    return _handleResponse(response);
  }

  static Future<dynamic> delete(String endpoint, {bool auth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final response = await _withNetwork(
      http.delete(url, headers: await _headers(auth: auth)),
    );
    return _handleResponse(response);
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      throw Exception('Sesión expirada, inicie sesión nuevamente');
    } else if (response.statusCode == 403) {
      final msg = _parseErrorMessage(response.body);
      throw Exception(msg ?? 'No tiene permisos para esta acción');
    } else if (response.statusCode == 404) {
      throw Exception(_parseErrorMessage(response.body) ??
          'Recurso no encontrado');
    } else {
      final msg = _parseErrorMessage(response.body);
      throw Exception(msg ?? 'Error del servidor: ${response.statusCode}');
    }
  }

  static String? _parseErrorMessage(String rawBody) {
    if (rawBody.isEmpty) return null;
    try {
      final body = jsonDecode(rawBody);
      if (body is! Map<String, dynamic>) return null;

      final head = body['message']?.toString();
      final errors = body['errors'];

      if (errors is List && errors.isNotEmpty) {
        final parts = errors.map((e) => e?.toString() ?? '').toList();
        final joined = parts.where((s) => s.isNotEmpty).join(' ');
        if (joined.isNotEmpty) {
          final base = head == null ||
                  head == 'Error de validación' ||
                  head.isEmpty
              ? ''
              : '$head. ';
          return '$base${parts.join('; ')}'.trim();
        }
      }

      if (body['error'] != null && body['error'].toString().isNotEmpty) {
        return body['error'].toString();
      }
      if (head != null && head.isNotEmpty) return head;
      return null;
    } catch (_) {
      return null;
    }
  }
}
