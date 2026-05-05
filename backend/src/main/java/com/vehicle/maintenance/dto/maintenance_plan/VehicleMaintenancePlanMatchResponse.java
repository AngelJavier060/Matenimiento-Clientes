package com.vehicle.maintenance.dto.maintenance_plan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Respuesta de resolución vehículo → plan preventivo cargado manualmente por MMY,
 * opcionalmente fijado en el vehículo (mantenimiento_plan_id).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleMaintenancePlanMatchResponse {

    private Long vehicleId;
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleYear;
    private Integer vehicleMileage;
    private String licensePlate;

    /** FIXED = plan manual en vehículo; MMY = emparejó marca/modelo/año; NONE = sin plan */
    private String matchMode;

    /** ID del plan usado cuando matchMode FIXED o MMY */
    private Long resolvedPlanId;

    private MaintenancePlanResponse plan;

    /** Texto aclaratorio para el taller (ej. cargar plan o revisar marca/modelo). */
    private String hint;

    /**
     * IDs de {@code maintenance_plan_activities} excluídos sólo para esta placa.
     */
    @Builder.Default
    private List<Long> excludedPreventiveActivityIds = new ArrayList<>();

    private Integer lastServiceMileage;
    private java.time.LocalDate lastServiceDate;

    /** Próximo servicio acordado en ficha (único por vehículo; km y/o fecha). */
    private Integer nextCommittedServiceMileage;
    private java.time.LocalDate nextCommittedServiceDate;
}
