package com.vehicle.maintenance.repository;

import com.vehicle.maintenance.model.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {

    List<Maintenance> findByVehicleIdOrderByServiceDateDesc(Long vehicleId);

    List<Maintenance> findByUserIdOrderByServiceDateDesc(Long userId);

    Optional<Maintenance> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT m FROM Maintenance m WHERE m.user.id = :userId " +
           "AND m.serviceDate BETWEEN :startDate AND :endDate ORDER BY m.serviceDate DESC")
    List<Maintenance> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT m FROM Maintenance m WHERE m.vehicle.id = :vehicleId " +
           "AND m.serviceType = :serviceType ORDER BY m.serviceDate DESC")
    List<Maintenance> findByVehicleIdAndServiceType(
            @Param("vehicleId") Long vehicleId,
            @Param("serviceType") String serviceType);

    long countByUserId(Long userId);

    long countByVehicleId(Long vehicleId);

    Optional<Maintenance> findFirstByVehicle_IdOrderByServiceDateDescIdDesc(Long vehicleId);
}
