package com.vehicle.maintenance.dto.maintenance;

import com.vehicle.maintenance.enums.MaintenanceStatus;
import com.vehicle.maintenance.enums.OdometerStatus;
import com.vehicle.maintenance.enums.ServiceCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    private OdometerStatus odometerStatus;
    private ServiceCategory serviceCategory;
    private BigDecimal cost;
    private LocalDate serviceDate;
    private Integer nextServiceMileage;
    private LocalDate nextServiceDate;
    private String workshopName;
    private String workshopAddress;
    private MaintenanceStatus status;
    private String documentsUrl;
    private String notes;
    @Builder.Default
    private List<MaintenanceLineResponse> lineItems = new ArrayList<>();
    private LocalDateTime createdAt;
}
