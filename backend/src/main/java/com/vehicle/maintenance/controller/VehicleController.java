package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.dto.maintenance_plan.MaintenancePlanActivityRequest;
import com.vehicle.maintenance.dto.maintenance_plan.MaintenancePlanActivityResponse;
import com.vehicle.maintenance.dto.vehicle.VehicleRequest;
import com.vehicle.maintenance.dto.vehicle.VehicleResponse;
import com.vehicle.maintenance.service.MaintenancePlanService;
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
    private final MaintenancePlanService maintenancePlanService;

    @GetMapping
    @Operation(summary = "Obtener todos los vehículos")
    public ResponseEntity<List<VehicleResponse>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/by-user/{userId}")
    @Operation(summary = "Obtener vehículos de un usuario específico")
    public ResponseEntity<List<VehicleResponse>> getVehiclesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(vehicleService.getAllVehicles(userId));
    }

    @GetMapping("/by-client/{clientId}")
    @Operation(summary = "Obtener vehículos de un cliente")
    public ResponseEntity<List<VehicleResponse>> getVehiclesByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByClient(clientId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener vehículo por ID")
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
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
        return ResponseEntity.ok(vehicleService.updateVehicle(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar vehículo (soft delete)")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{vehicleId}/preventive-activities/incorporate-from-template")
    @Operation(summary = "Copiar a esta placa las actividades de la plantilla MMY que falten (no modifica la plantilla)")
    public ResponseEntity<Void> incorporatePreventiveFromTemplate(@PathVariable Long vehicleId) {
        maintenancePlanService.incorporateTemplateActivitiesForVehicle(vehicleId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{vehicleId}/preventive-activities")
    @Operation(summary = "Agregar actividad preventiva sólo para esta unidad")
    public ResponseEntity<MaintenancePlanActivityResponse> addVehiclePreventiveActivity(
            @PathVariable Long vehicleId,
            @Valid @RequestBody MaintenancePlanActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenancePlanService.addVehiclePreventiveActivity(
                vehicleId, request, SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{vehicleId}/preventive-activities/{activityId}")
    @Operation(summary = "Actualizar actividad preventiva esta unidad")
    public ResponseEntity<MaintenancePlanActivityResponse> updateVehiclePreventiveActivity(
            @PathVariable Long vehicleId,
            @PathVariable Long activityId,
            @Valid @RequestBody MaintenancePlanActivityRequest request) {
        return ResponseEntity.ok(maintenancePlanService.updateVehiclePreventiveActivity(
                vehicleId, activityId, request, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{vehicleId}/preventive-activities/{activityId}")
    @Operation(summary = "Eliminar actividad preventiva de esta unidad (no borra la plantilla MMY)")
    public ResponseEntity<Void> deleteVehiclePreventiveActivity(
            @PathVariable Long vehicleId,
            @PathVariable Long activityId) {
        maintenancePlanService.deleteVehiclePreventiveActivity(vehicleId, activityId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
