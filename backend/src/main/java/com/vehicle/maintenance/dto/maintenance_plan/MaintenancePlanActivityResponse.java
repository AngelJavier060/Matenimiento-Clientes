package com.vehicle.maintenance.dto.maintenance_plan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenancePlanActivityResponse {

    private Long id;

    /** Si la línea proviene de copiar la plantilla: id de {@code maintenance_plan_activities}. */
    private Long clonedFromPlanActivityId;

    private String nombre;
    private String tipo;
    private Integer intervaloKm;
    private Integer intervaloMeses;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
