package com.vehicle.maintenance.dto.vehicle;

import com.vehicle.maintenance.enums.FuelType;
import com.vehicle.maintenance.enums.TransmissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {

    private Long id;
    private String brand;
    private String model;
    private Integer year;
    private String licensePlate;
    private String vin;
    private Integer mileage;
    private FuelType fuelType;
    private TransmissionType transmission;
    private String color;
    private String notes;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int maintenanceCount;
}
