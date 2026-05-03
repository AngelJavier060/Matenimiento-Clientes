package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.dto.vehicle.VehicleRequest;
import com.vehicle.maintenance.dto.vehicle.VehicleResponse;
import com.vehicle.maintenance.service.VehicleService;
import com.vehicle.maintenance.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehículos", description = "CRUD de vehículos del usuario")
@SecurityRequirement(name = "bearerAuth")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @Operation(summary = "Obtener todos los vehículos del usuario")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener vehículo por ID")
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo vehículo")
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.createVehicle(request, SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar vehículo")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar vehículo (soft delete)")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
