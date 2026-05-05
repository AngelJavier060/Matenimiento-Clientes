import '../config/api_config.dart';
import '../models/client/client_response.dart';
import 'api_service.dart';

class ClientService {
  Future<List<ClientResponse>> getClients() async {
    final data = await ApiService.get(ApiConfig.clients);
    return ApiPayload.decodeList(data).map(ClientResponse.fromJson).toList();
  }
}
