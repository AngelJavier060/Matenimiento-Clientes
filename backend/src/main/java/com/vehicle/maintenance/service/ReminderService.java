package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.reminder.ReminderRequest;
import com.vehicle.maintenance.dto.reminder.ReminderResponse;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.Maintenance;
import com.vehicle.maintenance.model.Reminder;
import com.vehicle.maintenance.repository.ReminderRepository;
import com.vehicle.maintenance.repository.UserRepository;
import com.vehicle.maintenance.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public List<ReminderResponse> getUserReminders(Long userId) {
        return reminderRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReminderResponse> getVehicleReminders(Long vehicleId, Long userId) {
        // Verificar que el vehículo pertenece al usuario
        vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));

        return reminderRepository.findByVehicleIdAndIsActiveTrueOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReminderResponse> getDueReminders(Long userId) {
        return reminderRepository.findDueRemindersByUser(userId, LocalDate.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ReminderResponse getReminderById(Long id, Long userId) {
        var reminder = reminderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recordatorio", id));
        return toResponse(reminder);
    }

    @Transactional
    public ReminderResponse createReminder(ReminderRequest request, Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        var vehicle = vehicleRepository.findByIdAndUserId(request.getVehicleId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", request.getVehicleId()));

        var reminder = Reminder.builder()
                .user(user)
                .vehicle(vehicle)
                .title(request.getTitle())
                .description(request.getDescription())
                .reminderType(request.getReminderType())
                .thresholdMileage(request.getThresholdMileage())
                .thresholdDate(request.getThresholdDate())
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurringInterval(request.getRecurringInterval())
                .isActive(true)
                .build();

        if (request.getMaintenanceId() != null) {
            // Solo guardamos el ID, la relación se maneja a través del maintenance_id
            reminder.setMaintenance(Maintenance.builder().id(request.getMaintenanceId()).build());
        }

        reminder = reminderRepository.save(reminder);
        return toResponse(reminder);
    }

    @Transactional
    public ReminderResponse updateReminder(Long id, ReminderRequest request, Long userId) {
        var reminder = reminderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recordatorio", id));

        // Si cambia el vehículo, verificar
        if (!reminder.getVehicle().getId().equals(request.getVehicleId())) {
            var newVehicle = vehicleRepository.findByIdAndUserId(request.getVehicleId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehículo", request.getVehicleId()));
            reminder.setVehicle(newVehicle);
        }

        reminder.setTitle(request.getTitle());
        reminder.setDescription(request.getDescription());
        reminder.setReminderType(request.getReminderType());
        reminder.setThresholdMileage(request.getThresholdMileage());
        reminder.setThresholdDate(request.getThresholdDate());
        reminder.setIsRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : reminder.getIsRecurring());
        reminder.setRecurringInterval(request.getRecurringInterval());

        reminder = reminderRepository.save(reminder);
        return toResponse(reminder);
    }

    @Transactional
    public void deleteReminder(Long id, Long userId) {
        var reminder = reminderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recordatorio", id));
        reminderRepository.delete(reminder);
    }

    @Transactional
    public void toggleReminder(Long id, Long userId) {
        var reminder = reminderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recordatorio", id));
        reminder.setIsActive(!reminder.getIsActive());
        reminderRepository.save(reminder);
    }

    private ReminderResponse toResponse(Reminder r) {
        return ReminderResponse.builder()
                .id(r.getId())
                .vehicleId(r.getVehicle().getId())
                .vehicleInfo(r.getVehicle().getBrand() + " " + r.getVehicle().getModel()
                        + " (" + r.getVehicle().getLicensePlate() + ")")
                .maintenanceId(r.getMaintenance() != null ? r.getMaintenance().getId() : null)
                .title(r.getTitle())
                .description(r.getDescription())
                .reminderType(r.getReminderType())
                .thresholdMileage(r.getThresholdMileage())
                .thresholdDate(r.getThresholdDate())
                .isRecurring(r.getIsRecurring())
                .recurringInterval(r.getRecurringInterval())
                .lastNotified(r.getLastNotified())
                .isActive(r.getIsActive())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
