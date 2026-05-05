package com.vehicle.maintenance.repository;

import com.vehicle.maintenance.model.VehiclePreventiveActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiclePreventiveActivityRepository extends JpaRepository<VehiclePreventiveActivity, Long> {

    @Query("""
            SELECT v FROM VehiclePreventiveActivity v
            LEFT JOIN FETCH v.clonedFrom
            WHERE v.vehicle.id = :vehicleId AND v.resolvedPlanTemplate.id = :resolvedPlanTemplateId
            ORDER BY v.intervaloKm ASC, v.id ASC""")
    List<VehiclePreventiveActivity> findByVehicleIdAndResolvedPlanTemplateIdOrderByIntervaloKmAscIdAsc(
            @Param("vehicleId") Long vehicleId,
            @Param("resolvedPlanTemplateId") Long resolvedPlanTemplateId);

    Optional<VehiclePreventiveActivity> findByIdAndVehicle_Id(Long id, Long vehicleId);

    @Query("""
            SELECT v FROM VehiclePreventiveActivity v
            WHERE v.vehicle.id = :vehicleId AND v.clonedFrom.id = :clonedId""")
    Optional<VehiclePreventiveActivity> findByVehicleIdAndClonedFromId(
            @Param("vehicleId") Long vehicleId, @Param("clonedId") Long clonedId);

    @Query("""
            SELECT DISTINCT v FROM VehiclePreventiveActivity v
            JOIN FETCH v.vehicle veh
            JOIN FETCH veh.user u
            WHERE v.id = :activityId AND v.vehicle.id = :vehicleId AND u.id = :userId""")
    Optional<VehiclePreventiveActivity> findByIdVehicleAndOwner(
            @Param("activityId") Long activityId,
            @Param("vehicleId") Long vehicleId,
            @Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            DELETE FROM VehiclePreventiveActivity v
            WHERE v.vehicle.id = :vehicleId AND v.resolvedPlanTemplate.id <> :planId""")
    void deleteRowsForMismatchingTemplate(@Param("vehicleId") Long vehicleId, @Param("planId") Long planId);
}
