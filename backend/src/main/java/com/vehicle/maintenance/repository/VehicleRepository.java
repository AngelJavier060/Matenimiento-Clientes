package com.vehicle.maintenance.repository;

import com.vehicle.maintenance.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);

    Optional<Vehicle> findByIdAndUserId(Long id, Long userId);

    boolean existsByLicensePlate(String licensePlate);
}
