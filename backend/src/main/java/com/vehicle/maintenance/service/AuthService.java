package com.vehicle.maintenance.service;

import com.vehicle.maintenance.config.JwtService;
import com.vehicle.maintenance.dto.auth.AuthResponse;
import com.vehicle.maintenance.dto.auth.LoginRequest;
import com.vehicle.maintenance.dto.auth.RegisterRequest;
import com.vehicle.maintenance.exception.BadRequestException;
import com.vehicle.maintenance.model.User;
import com.vehicle.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }

        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .documentId(request.getDocumentId())
                .address(request.getAddress())
                .isActive(true)
                .build();

        // Asignar rol si viene en la solicitud
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                user.setRole(com.vehicle.maintenance.enums.Role.valueOf(request.getRole()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Rol inválido: " + request.getRole());
            }
        }

        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Usuario no encontrado"));

        // Actualizar lastLogin
        user.setLastLogin(java.time.LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Usuario no encontrado"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        var token = jwtService.generateToken(user.getEmail(), user.getId(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpiration())
                .user(AuthResponse.UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole())
                        .documentId(user.getDocumentId())
                        .phone(user.getPhone())
                        .address(user.getAddress())
                        .avatarUrl(user.getAvatarUrl())
                        .isActive(user.getIsActive())
                        .build())
                .build();
    }
}
