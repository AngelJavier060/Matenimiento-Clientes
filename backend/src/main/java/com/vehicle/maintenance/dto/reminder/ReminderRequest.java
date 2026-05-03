package com.vehicle.maintenance.dto.reminder;

import com.vehicle.maintenance.enums.ReminderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRequest {

    @NotNull(message = "El ID del vehículo es obligatorio")
    private Long vehicleId;

    private Long maintenanceId;

    @NotBlank(message = "El título es obligatorio")
    private String title;

    private String description;

    @NotNull(message = "El tipo de recordatorio es obligatorio")
    private ReminderType reminderType;

    private Integer thresholdMileage;

    private LocalDate thresholdDate;

    private Boolean isRecurring;

    private Integer recurringInterval;
}
