package com.vehicle.maintenance.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_preventive_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehiclePreventiveActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    /** Plan MMY/template del que surge esta copia para la unidad. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resolved_plan_template_id", nullable = false)
    private MaintenancePlan resolvedPlanTemplate;

    /** Línea de plantilla originaria; null si el taller agregó una actividad solo para esta unidad. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cloned_from_activity_id")
    private MaintenancePlanActivity clonedFrom;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, length = 5)
    private String tipo;

    @Column(name = "intervalo_km", nullable = false)
    private Integer intervaloKm;

    @Column(name = "intervalo_meses", nullable = false)
    private Integer intervaloMeses;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
