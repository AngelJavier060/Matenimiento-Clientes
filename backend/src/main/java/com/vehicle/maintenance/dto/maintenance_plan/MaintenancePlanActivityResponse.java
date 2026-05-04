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
    private String nombre;
    private String tipo;
    private Integer intervaloKm;
    private Integer intervaloMeses;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
