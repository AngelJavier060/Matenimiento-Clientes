package com.vehicle.maintenance.dto.maintenance;

import com.vehicle.maintenance.enums.MaintenanceLineType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceLineResponse {

    private Long id;
    private MaintenanceLineType lineType;
    private String description;
    private Boolean done;
    private Boolean includedInRecord;
    private Integer sortOrder;
}
