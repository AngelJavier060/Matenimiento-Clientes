package com.vehicle.maintenance.dto.maintenance_plan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenancePlanResponse {

    private Long id;
    private String marca;
    private String modelo;
    private Integer anio;
    private String motor;
    private String tipoAceite;
    private String fuente;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<MaintenancePlanActivityResponse> activities;
    private int activityCount;
}
