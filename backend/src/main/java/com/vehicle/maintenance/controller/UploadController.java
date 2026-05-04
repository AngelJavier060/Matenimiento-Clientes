package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.service.UserService;
import com.vehicle.maintenance.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private static final String AVATAR_DIR = "uploads/avatars/";
    private static final String VEHICLE_DIR = "uploads/vehicles/";

    private final UserService userService;
    private final VehicleService vehicleService;

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId,
            Authentication authentication) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
        }

        // Validar tipo de archivo
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));
        }

        // Validar tamaño (máx 2MB)
        if (file.getSize() > 2 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "La imagen no puede superar 2MB"));
        }

        try {
            // Crear directorio si no existe
            Path uploadPath = Paths.get(AVATAR_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generar nombre único
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            // Guardar archivo
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // URL pública
            String avatarUrl = "/uploads/avatars/" + fileName;

            // Actualizar usuario en BD
            userService.updateAvatarUrl(userId, avatarUrl);

            return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al guardar la imagen"));
        }
    }

    @PostMapping("/vehicle-photo")
    public ResponseEntity<?> uploadVehiclePhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam("vehicleId") Long vehicleId) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Solo se permiten imágenes"));
        }

        if (file.getSize() > 2 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "La imagen no puede superar 2MB"));
        }

        try {
            Path uploadPath = Paths.get(VEHICLE_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/vehicles/" + fileName;

            // Actualizar vehículo en BD
            var request = com.vehicle.maintenance.dto.vehicle.VehicleRequest.builder()
                    .imageUrl(imageUrl)
                    .build();
            vehicleService.updateVehicle(vehicleId, request);

            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al guardar la imagen"));
        }
    }
}
