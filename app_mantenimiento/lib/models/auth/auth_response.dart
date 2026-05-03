class AuthResponse {
  final String token;
  final String tokenType;
  final int expiresIn;
  final UserResponse user;

  AuthResponse({
    required this.token,
    required this.tokenType,
    required this.expiresIn,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        token: json['token'] ?? '',
        tokenType: json['tokenType'] ?? 'Bearer',
        expiresIn: json['expiresIn'] ?? 0,
        user: UserResponse.fromJson(json['user'] ?? {}),
      );

  String get fullName => user.fullName;
  String get email => user.email;
  int get userId => user.id;
}

class UserResponse {
  final int id;
  final String email;
  final String fullName;
  final String? phone;
  final String? avatarUrl;

  UserResponse({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.avatarUrl,
  });

  factory UserResponse.fromJson(Map<String, dynamic> json) => UserResponse(
        id: json['id'] ?? 0,
        email: json['email'] ?? '',
        fullName: json['fullName'] ?? '',
        phone: json['phone'],
        avatarUrl: json['avatarUrl'],
      );
}
