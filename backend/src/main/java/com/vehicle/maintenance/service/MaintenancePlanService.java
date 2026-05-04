package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.maintenance_plan.*;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.MaintenancePlan;
import com.vehicle.maintenance.model.MaintenancePlanActivity;
import com.vehicle.maintenance.model.User;
import com.vehicle.maintenance.repository.MaintenancePlanActivityRepository;
import com.vehicle.maintenance.repository.MaintenancePlanRepository;
import com.vehicle.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenancePlanService {

    private final MaintenancePlanRepository planRepository;
    private final MaintenancePlanActivityRepository activityRepository;
    private final UserRepository userRepository;

    // ----------------------------------------------------------
    // PLANS CRUD
    // ----------------------------------------------------------

    public List<MaintenancePlanResponse> getAllPlans(Long userId) {
        return planRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    public MaintenancePlanResponse getPlanById(Long id, Long userId) {
        var plan = planRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", id));
        return toPlanResponse(plan);
    }

    @Transactional
    public MaintenancePlanResponse createPlan(MaintenancePlanRequest request, Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        var plan = MaintenancePlan.builder()
                .marca(request.getMarca())
                .modelo(request.getModelo())
                .anio(request.getAnio())
                .motor(request.getMotor() != null ? request.getMotor() : "")
                .tipoAceite(request.getTipoAceite() != null ? request.getTipoAceite() : "")
                .fuente(request.getFuente() != null ? request.getFuente() : "Usuario")
                .user(user)
                .build();

        var savedPlan = planRepository.save(plan);

        // Guardar actividades si vienen incluidas
        if (request.getActivities() != null) {
            for (var actReq : request.getActivities()) {
                var activity = MaintenancePlanActivity.builder()
                        .nombre(actReq.getNombre())
                        .tipo(actReq.getTipo())
                        .intervaloKm(actReq.getIntervaloKm())
                        .intervaloMeses(actReq.getIntervaloMeses())
                        .plan(savedPlan)
                        .build();
                activityRepository.save(activity);
            }
        }

        return toPlanResponse(planRepository.findById(savedPlan.getId()).orElse(savedPlan));
    }

    @Transactional
    public MaintenancePlanResponse updatePlan(Long id, MaintenancePlanRequest request, Long userId) {
        var plan = planRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", id));

        plan.setMarca(request.getMarca());
        plan.setModelo(request.getModelo());
        plan.setAnio(request.getAnio());
        plan.setMotor(request.getMotor() != null ? request.getMotor() : "");
        plan.setTipoAceite(request.getTipoAceite() != null ? request.getTipoAceite() : "");
        plan.setFuente(request.getFuente() != null ? request.getFuente() : "Usuario");

        var savedPlan = planRepository.save(plan);

        // Reemplazar actividades si se envían
        if (request.getActivities() != null) {
            activityRepository.deleteByPlanId(savedPlan.getId());
            for (var actReq : request.getActivities()) {
                var activity = MaintenancePlanActivity.builder()
                        .nombre(actReq.getNombre())
                        .tipo(actReq.getTipo())
                        .intervaloKm(actReq.getIntervaloKm())
                        .intervaloMeses(actReq.getIntervaloMeses())
                        .plan(savedPlan)
                        .build();
                activityRepository.save(activity);
            }
        }

        return toPlanResponse(planRepository.findById(savedPlan.getId()).orElse(savedPlan));
    }

    @Transactional
    public void deletePlan(Long id, Long userId) {
        var plan = planRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", id));
        plan.setIsActive(false);
        planRepository.save(plan);
    }

    // ----------------------------------------------------------
    // ACTIVITIES CRUD (independiente)
    // ----------------------------------------------------------

    public List<MaintenancePlanActivityResponse> getActivitiesByPlanId(Long planId, Long userId) {
        // Verificar que el plan pertenece al usuario
        planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", planId));

        return activityRepository.findByPlanIdAndIsActiveTrueOrderByIntervaloKmAsc(planId)
                .stream()
                .map(this::toActivityResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MaintenancePlanActivityResponse addActivity(Long planId, MaintenancePlanActivityRequest request, Long userId) {
        final var plan = planRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", planId));

        var activity = MaintenancePlanActivity.builder()
                .nombre(request.getNombre())
                .tipo(request.getTipo())
                .intervaloKm(request.getIntervaloKm())
                .intervaloMeses(request.getIntervaloMeses())
                .plan(plan)
                .build();

        var savedActivity = activityRepository.save(activity);
        return toActivityResponse(savedActivity);
    }

    @Transactional
    public MaintenancePlanActivityResponse updateActivity(Long activityId, MaintenancePlanActivityRequest request, Long userId) {
        final var activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad", activityId));

        // Verificar que el plan pertenece al usuario
        planRepository.findByIdAndUserId(activity.getPlan().getId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", activity.getPlan().getId()));

        activity.setNombre(request.getNombre());
        activity.setTipo(request.getTipo());
        activity.setIntervaloKm(request.getIntervaloKm());
        activity.setIntervaloMeses(request.getIntervaloMeses());

        var savedActivity = activityRepository.save(activity);
        return toActivityResponse(savedActivity);
    }

    @Transactional
    public void deleteActivity(Long activityId, Long userId) {
        var activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad", activityId));

        // Verificar que el plan pertenece al usuario
        planRepository.findByIdAndUserId(activity.getPlan().getId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", activity.getPlan().getId()));

        activity.setIsActive(false);
        activityRepository.save(activity);
    }

    // ----------------------------------------------------------
    // MAPPERS
    // ----------------------------------------------------------

    private MaintenancePlanResponse toPlanResponse(MaintenancePlan plan) {
        List<MaintenancePlanActivityResponse> activities = new java.util.ArrayList<>();
        if (plan.getActivities() != null) {
            for (var a : plan.getActivities()) {
                if (a.getIsActive()) {
                    activities.add(toActivityResponse(a));
                }
            }
        }

        return MaintenancePlanResponse.builder()
                .id(plan.getId())
                .marca(plan.getMarca())
                .modelo(plan.getModelo())
                .anio(plan.getAnio())
                .motor(plan.getMotor())
                .tipoAceite(plan.getTipoAceite())
                .fuente(plan.getFuente())
                .isActive(plan.getIsActive())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .activities(activities)
                .activityCount(activities.size())
                .build();
    }

    private MaintenancePlanActivityResponse toActivityResponse(MaintenancePlanActivity a) {
        return MaintenancePlanActivityResponse.builder()
                .id(a.getId())
                .nombre(a.getNombre())
                .tipo(a.getTipo())
                .intervaloKm(a.getIntervaloKm())
                .intervaloMeses(a.getIntervaloMeses())
                .isActive(a.getIsActive())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
