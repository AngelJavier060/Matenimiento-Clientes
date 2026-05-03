package com.vehicle.maintenance.dto.reminder;

import com.vehicle.maintenance.enums.ReminderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleInfo;
    private Long maintenanceId;
    private String title;
    private String description;
    private ReminderType reminderType;
    private Integer thresholdMileage;
    private LocalDate thresholdDate;
    private Boolean isRecurring;
    private Integer recurringInterval;
    private LocalDateTime lastNotified;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
