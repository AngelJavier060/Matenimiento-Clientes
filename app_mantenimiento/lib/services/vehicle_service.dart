import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/vehicle/vehicle_request.dart';
import '../models/vehicle/vehicle_response.dart';
import 'api_service.dart';

class VehicleService {
  Future<List<VehicleResponse>> getVehicles() async {
    final data = await ApiService.get(ApiConfig.vehicles);
    final list = ApiPayload.decodeList(data);
    return list.map((e) => VehicleResponse.fromJson(e)).toList();
  }

  Future<VehicleResponse> getVehicleById(int id) async {
    final raw = await ApiService.get(ApiConfig.vehicleById(id));
    return VehicleResponse.fromJson(ApiPayload.decodeMap(raw));
  }

  Future<VehicleResponse> createVehicle(VehicleRequest request) async {
    final raw = await ApiService.post(
      ApiConfig.vehicles,
      body: request.toJson(),
    );
    return VehicleResponse.fromJson(ApiPayload.decodeMap(raw));
  }

  Future<VehicleResponse> updateVehicle(int id, VehicleRequest request) async {
    final raw = await ApiService.put(
      ApiConfig.vehicleById(id),
      body: request.toJson(),
    );
    return VehicleResponse.fromJson(ApiPayload.decodeMap(raw));
  }

  Future<void> deleteVehicle(int id) async {
    await ApiService.delete(ApiConfig.vehicleById(id));
  }

  /// Backend `POST /upload/vehicle-photo` — `multipart/form-data`, `file`, `vehicleId`.
  Future<String> uploadVehiclePhoto({
    required int vehicleId,
    required String localFilePath,
  }) async {
    final uri =
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.uploadVehiclePhoto}');

    final request = http.MultipartRequest('POST', uri);
    final token = await ApiService.getToken();
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.fields['vehicleId'] = '$vehicleId';
    final parts =
        localFilePath.replaceAll(r'\', '/').split('/');
    final basename = parts.isEmpty
        ? 'vehiculo.jpg'
        : parts.lastWhere((s) => s.isNotEmpty, orElse: () => 'vehiculo.jpg');

    final hasLikelyExtension = RegExp(r'\.[a-zA-Z0-9]{2,5}$').hasMatch(basename);
    final filename = hasLikelyExtension ? basename : '$basename.jpg';

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        localFilePath,
        filename: filename,
      ),
    );

    http.StreamedResponse streamed;
    try {
      streamed = await request.send().timeout(const Duration(seconds: 55));
    } on TimeoutException {
      throw Exception(
          'Tiempo agotado al subir la foto. ¿El servidor responde? '
          '(máximo 2MB y solo imágenes).');
    } on SocketException {
      throw Exception('Sin conexión al subir la imagen.');
    }

    final response = await http.Response.fromStream(streamed);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = jsonDecode(response.body);
      if (decoded is Map && decoded['imageUrl'] != null) {
        return decoded['imageUrl'].toString();
      }
      throw Exception('Respuesta de subida inesperada.');
    }

    throw Exception(_uploadErrorMessage(response.body));
  }

  static String _uploadErrorMessage(String raw) {
    if (raw.trim().isEmpty) return 'No se pudo subir la imagen.';
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        final e = decoded['error'];
        if (e != null && e.toString().isNotEmpty) return e.toString();
        final m = decoded['message'];
        if (m != null && m.toString().isNotEmpty) return m.toString();
      }
    } catch (_) {}
    return raw;
  }
}
