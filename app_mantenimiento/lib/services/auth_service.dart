import '../config/api_config.dart';
import '../models/auth/auth_response.dart';
import '../models/auth/login_request.dart';
import '../models/auth/register_request.dart';
import 'api_service.dart';

class AuthService {
  Future<AuthResponse> register(RegisterRequest request) async {
    final data = ApiPayload.decodeMap(await ApiService.post(
      ApiConfig.authRegister,
      body: request.toJson(),
      auth: false,
    ));
    final authResponse = AuthResponse.fromJson(data);
    await ApiService.saveToken(authResponse.token);
    return authResponse;
  }

  Future<AuthResponse> login(LoginRequest request) async {
    final data = ApiPayload.decodeMap(await ApiService.post(
      ApiConfig.authLogin,
      body: request.toJson(),
      auth: false,
    ));
    final authResponse = AuthResponse.fromJson(data);
    await ApiService.saveToken(authResponse.token);
    return authResponse;
  }

  Future<AuthResponse> refreshToken() async {
    final data =
        ApiPayload.decodeMap(await ApiService.post(ApiConfig.authRefresh));
    final authResponse = AuthResponse.fromJson(data);
    await ApiService.saveToken(authResponse.token);
    return authResponse;
  }

  Future<void> logout() async {
    await ApiService.removeToken();
  }

  Future<bool> isLoggedIn() async {
    final token = await ApiService.getToken();
    return token != null && token.isNotEmpty;
  }
}
