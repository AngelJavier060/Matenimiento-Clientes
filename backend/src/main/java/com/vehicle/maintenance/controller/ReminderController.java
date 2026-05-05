package com.vehicle.maintenance.controller;

import com.vehicle.maintenance.dto.reminder.ReminderRequest;
import com.vehicle.maintenance.dto.reminder.ReminderResponse;
import com.vehicle.maintenance.service.ReminderService;
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
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@Tag(name = "Recordatorios", description = "Gestión de recordatorios de mantenimiento")
@SecurityRequirement(name = "bearerAuth")
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    @Operation(summary = "Obtener todos los recordatorios del usuario")
    public ResponseEntity<List<ReminderResponse>> getUserReminders() {
        return ResponseEntity.ok(reminderService.getUserReminders(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Obtener recordatorios de un vehículo")
    public ResponseEntity<List<ReminderResponse>> getVehicleReminders(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(reminderService.getVehicleReminders(vehicleId, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/due")
    @Operation(summary = "Obtener recordatorios vencidos/próximos")
    public ResponseEntity<List<ReminderResponse>> getDueReminders() {
        return ResponseEntity.ok(reminderService.getDueReminders(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener recordatorio por ID")
    public ResponseEntity<ReminderResponse> getReminderById(@PathVariable Long id) {
        return ResponseEntity.ok(reminderService.getReminderById(id, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping
    @Operation(summary = "Crear recordatorio (deshabilitado: solo automáticos desde mantenimiento)")
    public ResponseEntity<ReminderResponse> createReminder(@Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reminderService.createReminder(request, SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar recordatorio (deshabilitado: edite el mantenimiento / próximo servicio)")
    public ResponseEntity<ReminderResponse> updateReminder(
            @PathVariable Long id,
            @Valid @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.updateReminder(id, request, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar recordatorio")
    public ResponseEntity<Void> deleteReminder(@PathVariable Long id) {
        reminderService.deleteReminder(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Activar/Desactivar recordatorio")
    public ResponseEntity<Void> toggleReminder(@PathVariable Long id) {
        reminderService.toggleReminder(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok().build();
    }
}
