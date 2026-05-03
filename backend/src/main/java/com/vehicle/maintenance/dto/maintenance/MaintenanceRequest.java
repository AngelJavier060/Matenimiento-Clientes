package com.vehicle.maintenance.dto.maintenance;

import com.vehicle.maintenance.enums.MaintenanceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequest {

    @NotNull(message = "El ID del vehículo es obligatorio")
    private Long vehicleId;

    @NotBlank(message = "El tipo de servicio es obligatorio")
    private String serviceType;

    private String description;

    @NotNull(message = "El kilometraje del servicio es obligatorio")
    @Min(value = 0, message = "El kilometraje no puede ser negativo")
    private Integer mileageAtService;

    @Min(value = 0, message = "El costo no puede ser negativo")
    private BigDecimal cost;

    @NotNull(message = "La fecha del servicio es obligatoria")
    @PastOrPresent(message = "La fecha del servicio no puede ser futura")
    private LocalDate serviceDate;

    @Min(value = 0, message = "El próximo kilometraje no puede ser negativo")
    private Integer nextServiceMileage;

    private LocalDate nextServiceDate;

    private String workshopName;

    private String workshopAddress;

    private MaintenanceStatus status;

    private String documentsUrl;

    private String notes;
}
