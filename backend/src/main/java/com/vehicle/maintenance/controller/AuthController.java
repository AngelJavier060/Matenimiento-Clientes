package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.dto.auth.AuthResponse;
import com.vehicle.maintenance.dto.auth.LoginRequest;
import com.vehicle.maintenance.dto.auth.RegisterRequest;
import com.vehicle.maintenance.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para registro, login y refresh de tokens")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refrescar token JWT")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String authHeader) {
        String email = extractEmailFromToken(authHeader);
        return ResponseEntity.ok(authService.refreshToken(email));
    }

    private String extractEmailFromToken(String authHeader) {
        // El email se extrae del token en el filtro JWT
        // Este endpoint asume que el token es válido (pasa por el filtro)
        return authHeader.replace("Bearer ", "");
    }
}
