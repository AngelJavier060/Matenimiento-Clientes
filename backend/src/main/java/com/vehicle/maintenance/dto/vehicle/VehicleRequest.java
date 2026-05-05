package com.vehicle.maintenance.dto.vehicle;

import com.vehicle.maintenance.enums.FuelType;
import com.vehicle.maintenance.enums.TransmissionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequest {

    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 100, message = "La marca no puede exceder 100 caracteres")
    private String brand;

    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 100, message = "El modelo no puede exceder 100 caracteres")
    private String model;

    @Min(value = 1900, message = "El año mínimo es 1900")
    @Max(value = 2030, message = "El año máximo es 2030")
    private Integer year;

    @Size(max = 20, message = "La placa no puede exceder 20 caracteres")
    private String licensePlate;

    @Size(max = 17, message = "El VIN debe tener máximo 17 caracteres")
    private String vin;

    @Min(value = 0, message = "El kilometraje no puede ser negativo")
    private Integer mileage;

    private FuelType fuelType;

    private TransmissionType transmission;

    @Size(max = 50, message = "El color no puede exceder 50 caracteres")
    private String color;

    private String imageUrl;

    private Long clientId;

    private String notes;

    /**
     * Plan MP fijo: si viene en el JSON, se establece (o {@code null} desvincula).
     * Si la clave <strong>no</strong> aparece en el cuerpo, en una <strong>actualización</strong> no se debe tocar la relación ya guardada —
     * de lo contrario, clientes que hacen PUT sin este campo borraban vínculos de otras placas.
     */
    @Setter(AccessLevel.NONE)
    private Long maintenancePlanId;

    /** {@code true} solo tras deserializar {@code maintenancePlanId} desde JSON (incluye {@code null} explícito). */
    @JsonIgnore
    @Builder.Default
    private boolean maintenancePlanIdProvided = false;

    @JsonProperty("maintenancePlanId")
    public void setMaintenancePlanId(Long maintenancePlanId) {
        this.maintenancePlanId = maintenancePlanId;
        this.maintenancePlanIdProvided = true;
    }

    /**
     * Próximo mantenimiento acordado para esta unidad (único): km y/o fecha.
     * Cada clave con presencia JSON activa persisted update (permite borrar compromiso explícito con {@code null}).
     */
    @Min(value = 0, message = "El kilometraje comprometido no puede ser negativo")
    @Setter(AccessLevel.NONE)
    private Integer nextCommittedServiceMileage;

    @Setter(AccessLevel.NONE)
    private LocalDate nextCommittedServiceDate;

    @JsonIgnore
    @Builder.Default
    private boolean nextCommittedServiceMileageProvided = false;

    @JsonIgnore
    @Builder.Default
    private boolean nextCommittedServiceDateProvided = false;

    @JsonProperty("nextCommittedServiceMileage")
    public void setNextCommittedServiceMileage(Integer value) {
        this.nextCommittedServiceMileage = value;
        this.nextCommittedServiceMileageProvided = true;
    }

    @JsonProperty("nextCommittedServiceDate")
    public void setNextCommittedServiceDate(LocalDate value) {
        this.nextCommittedServiceDate = value;
        this.nextCommittedServiceDateProvided = true;
    }
}
