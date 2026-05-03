package com.vehicle.maintenance.dto.vehicle;

import com.vehicle.maintenance.enums.FuelType;
import com.vehicle.maintenance.enums.TransmissionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    private String notes;
}
