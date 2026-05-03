package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.dto.maintenance.MaintenanceRequest;
import com.vehicle.maintenance.dto.maintenance.MaintenanceResponse;
import com.vehicle.maintenance.service.MaintenanceService;
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
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@Tag(name = "Mantenimiento", description = "Registro y consulta de servicios de mantenimiento")
@SecurityRequirement(name = "bearerAuth")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Obtener mantenimientos de un vehículo")
    public ResponseEntity<List<MaintenanceResponse>> getVehicleMaintenances(
            @PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getMaintenancesByVehicle(vehicleId, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping
    @Operation(summary = "Obtener todos los mantenimientos del usuario")
    public ResponseEntity<List<MaintenanceResponse>> getAllMaintenances() {
        return ResponseEntity.ok(maintenanceService.getAllUserMaintenances(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener mantenimiento por ID")
    public ResponseEntity<MaintenanceResponse> getMaintenanceById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getMaintenanceById(id, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo servicio de mantenimiento")
    public ResponseEntity<MaintenanceResponse> createMaintenance(@Valid @RequestBody MaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(maintenanceService.createMaintenance(request, SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar servicio de mantenimiento")
    public ResponseEntity<MaintenanceResponse> updateMaintenance(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.updateMaintenance(id, request, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar servicio de mantenimiento")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long id) {
        maintenanceService.deleteMaintenance(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
