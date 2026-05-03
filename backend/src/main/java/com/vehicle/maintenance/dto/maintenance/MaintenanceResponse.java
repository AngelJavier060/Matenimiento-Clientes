package com.vehicle.maintenance.dto.maintenance;

import com.vehicle.maintenance.enums.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {

    private Long id;
    private Long vehicleId;
    private String vehicleInfo;
    private String serviceType;
    private String description;
    private Integer mileageAtService;
    private BigDecimal cost;
    private LocalDate serviceDate;
    private Integer nextServiceMileage;
    private LocalDate nextServiceDate;
    private String workshopName;
    private String workshopAddress;
    private MaintenanceStatus status;
    private String documentsUrl;
    private String notes;
    private LocalDateTime createdAt;
}
