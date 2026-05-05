package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.dto.maintenance_plan.*;
import com.vehicle.maintenance.service.MaintenancePlanService;
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
@RequestMapping("/api/maintenance-plans")
@RequiredArgsConstructor
@Tag(name = "Plan de Mantenimiento Preventivo",
     description = "Planes MP por marca/modelo/año y sus actividades programadas")
@SecurityRequirement(name = "bearerAuth")
public class MaintenancePlanController {

    private final MaintenancePlanService planService;

    // ==================== PLANES ====================

    @GetMapping
    @Operation(summary = "Obtener todos los planes del usuario")
    public ResponseEntity<List<MaintenancePlanResponse>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllPlans(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/for-vehicle/{vehicleId}")
    @Operation(summary = "Resolver plan MP del vehículo (MMY o plan fijo en unidad)")
    public ResponseEntity<VehicleMaintenancePlanMatchResponse> resolvePlanForVehicle(
            @PathVariable Long vehicleId) {
        return ResponseEntity.ok(planService.resolvePlanForVehicle(vehicleId, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener plan por ID con sus actividades")
    public ResponseEntity<MaintenancePlanResponse> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(planService.getPlanById(id, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo plan de mantenimiento")
    public ResponseEntity<MaintenancePlanResponse> createPlan(
            @Valid @RequestBody MaintenancePlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(planService.createPlan(request, SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un plan existente")
    public ResponseEntity<MaintenancePlanResponse> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody MaintenancePlanRequest request) {
        return ResponseEntity.ok(planService.updatePlan(id, request, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un plan (borrado lógico)")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== ACTIVIDADES ====================

    @GetMapping("/{planId}/activities")
    @Operation(summary = "Obtener actividades de un plan")
    public ResponseEntity<List<MaintenancePlanActivityResponse>> getActivities(
            @PathVariable Long planId) {
        return ResponseEntity.ok(planService.getActivitiesByPlanId(planId, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/{planId}/activities")
    @Operation(summary = "Agregar actividad a un plan")
    public ResponseEntity<MaintenancePlanActivityResponse> addActivity(
            @PathVariable Long planId,
            @Valid @RequestBody MaintenancePlanActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(planService.addActivity(planId, request, SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{planId}/activities/{activityId}")
    @Operation(summary = "Actualizar una actividad")
    public ResponseEntity<MaintenancePlanActivityResponse> updateActivity(
            @PathVariable Long planId,
            @PathVariable Long activityId,
            @Valid @RequestBody MaintenancePlanActivityRequest request) {
        return ResponseEntity.ok(planService.updateActivity(activityId, request, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{planId}/activities/{activityId}")
    @Operation(summary = "Eliminar una actividad (borrado lógico)")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable Long planId,
            @PathVariable Long activityId) {
        planService.deleteActivity(activityId, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
