package com.vehicle.maintenance.dto.maintenance;

import com.vehicle.maintenance.enums.MaintenanceLineType;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceLineRequest {

    /** Opcional para actualizar una línea existente. */
    private Long id;

    /** Si es null se trata como {@link MaintenanceLineType#PERFORMED}. */
    private MaintenanceLineType lineType;

    /**
     * Líneas con descripción vacía se ignoran al persistir ({@link MaintenanceService#sanitizeLineRequests}).
     */
    private String description;

    @Builder.Default
    private Boolean done = false;

    @Builder.Default
    private Boolean includedInRecord = true;

    @Min(0)
    @Builder.Default
    private Integer sortOrder = 0;
}
