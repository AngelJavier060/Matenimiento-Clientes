package com.vehicle.maintenance.dto.maintenance_plan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenancePlanActivityRequest {

    @NotBlank(message = "El nombre de la actividad es obligatorio")
    private String nombre;

    @NotBlank(message = "El tipo de operación es obligatorio")
    private String tipo;

    @NotNull(message = "El intervalo en km es obligatorio")
    private Integer intervaloKm;

    @NotNull(message = "El intervalo en meses es obligatorio")
    private Integer intervaloMeses;

    /**
     * Opcional: al dar de alta en el libro por placa, enlaza esta fila al id de {@code MaintenancePlanActivity}
     * del plan MMY (mismo resolved template). Si no viene, línea sólo-manual sin vínculo a catálogo.
     */
    private Long cloneFromPlanActivityId;
}
