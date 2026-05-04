package com.vehicle.maintenance.repository;

import com.vehicle.maintenance.model.MaintenancePlanActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Repository
public interface MaintenancePlanActivityRepository extends JpaRepository<MaintenancePlanActivity, Long> {

    List<MaintenancePlanActivity> findByPlanIdAndIsActiveTrueOrderByIntervaloKmAsc(Long planId);

    List<MaintenancePlanActivity> findByPlanIdOrderByIntervaloKmAsc(Long planId);

    @Transactional
    void deleteByPlanId(Long planId);
}
