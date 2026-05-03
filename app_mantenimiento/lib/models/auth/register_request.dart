class RegisterRequest {
  final String fullName;
  final String email;
  final String password;
  final String? phone;

  RegisterRequest({
    required this.fullName,
    required this.email,
    required this.password,
    this.phone,
  });

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'email': email,
        'password': password,
        'phone': phone,
      };
}
