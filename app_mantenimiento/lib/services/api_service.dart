import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static const String _tokenKey = 'auth_token';

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

  static Future<Map<String, dynamic>> get(String endpoint,
      {bool auth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response =
          await http.get(url, headers: await _headers(auth: auth));
      return _handleResponse(response);
    } on SocketException {
      throw Exception('Error de conexión al servidor');
    }
  }

  static Future<Map<String, dynamic>> post(String endpoint,
      {Map<String, dynamic>? body, bool auth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response = await http.post(
        url,
        headers: await _headers(auth: auth),
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw Exception('Error de conexión al servidor');
    }
  }

  static Future<Map<String, dynamic>> put(String endpoint,
      {Map<String, dynamic>? body, bool auth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response = await http.put(
        url,
        headers: await _headers(auth: auth),
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw Exception('Error de conexión al servidor');
    }
  }

  static Future<Map<String, dynamic>> delete(String endpoint,
      {bool auth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response =
          await http.delete(url, headers: await _headers(auth: auth));
      return _handleResponse(response);
    } on SocketException {
      throw Exception('Error de conexión al servidor');
    }
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      throw Exception('Sesión expirada, inicie sesión nuevamente');
    } else if (response.statusCode == 403) {
      throw Exception('No tiene permisos para esta acción');
    } else if (response.statusCode == 404) {
      throw Exception('Recurso no encontrado');
    } else {
      try {
        final body = jsonDecode(response.body);
        final message = body['message'] ?? body['error'] ?? 'Error desconocido';
        throw Exception(message);
      } catch (_) {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    }
  }
}
