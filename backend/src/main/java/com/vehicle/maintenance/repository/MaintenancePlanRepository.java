package com.vehicle.maintenance.repository;

import com.vehicle.maintenance.model.MaintenancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenancePlanRepository extends JpaRepository<MaintenancePlan, Long> {

    List<MaintenancePlan> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);

    Optional<MaintenancePlan> findByIdAndUserId(Long id, Long userId);

    List<MaintenancePlan> findByIsActiveTrueOrderByCreatedAtDesc();
}
