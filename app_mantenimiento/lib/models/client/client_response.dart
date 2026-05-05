class ClientResponse {
  final int id;
  final String fullName;
  final String? email;
  final String? phone;

  ClientResponse({
    required this.id,
    required this.fullName,
    this.email,
    this.phone,
  });

  factory ClientResponse.fromJson(Map<String, dynamic> json) => ClientResponse(
        id: (json['id'] as num?)?.toInt() ?? 0,
        fullName: json['fullName']?.toString() ?? '',
        email: json['email']?.toString(),
        phone: json['phone']?.toString(),
      );
}
