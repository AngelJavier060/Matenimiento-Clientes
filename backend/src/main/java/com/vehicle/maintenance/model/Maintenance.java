package com.vehicle.maintenance.model;

import com.vehicle.maintenance.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Maintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "service_type", nullable = false, length = 100)
    private String serviceType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "mileage_at_service", nullable = false)
    private Integer mileageAtService;

    @Column(precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "next_service_mileage")
    private Integer nextServiceMileage;

    @Column(name = "next_service_date")
    private LocalDate nextServiceDate;

    @Column(name = "workshop_name", length = 200)
    private String workshopName;

    @Column(name = "workshop_address", length = 300)
    private String workshopAddress;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private MaintenanceStatus status = MaintenanceStatus.COMPLETED;

    @Column(name = "documents_url", columnDefinition = "TEXT")
    private String documentsUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
