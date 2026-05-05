package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.maintenance_plan.*;
import com.vehicle.maintenance.exception.BadRequestException;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.MaintenancePlan;
import com.vehicle.maintenance.model.MaintenancePlanActivity;
import com.vehicle.maintenance.model.Vehicle;
import com.vehicle.maintenance.model.VehiclePreventiveActivity;
import com.vehicle.maintenance.repository.MaintenancePlanActivityRepository;
import com.vehicle.maintenance.repository.MaintenancePlanRepository;
import com.vehicle.maintenance.repository.MaintenanceRepository;
import com.vehicle.maintenance.repository.UserRepository;
import com.vehicle.maintenance.repository.VehiclePreventiveActivityRepository;
import com.vehicle.maintenance.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenancePlanService {

    private final MaintenancePlanRepository planRepository;
    private final MaintenancePlanActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final VehiclePreventiveActivityRepository vehiclePreventiveActivityRepository;

    // ----------------------------------------------------------
    // PLANS CRUD
    // ----------------------------------------------------------

    public List<MaintenancePlanResponse> getAllPlans(Long userId) {
        return planRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    /**
     * Resolver plan MP para un vehículo: FK manual opcional ({@code Vehicle.maintenancePlan})
     * o emparejar por marca + modelo + año con planes del usuario (carga manual taller).
     */
    @Transactional
    public VehicleMaintenancePlanMatchResponse resolvePlanForVehicle(Long vehicleId, Long userId) {
        var vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));

        var base = VehicleMaintenancePlanMatchResponse.builder()
                .vehicleId(vehicleId)
                .vehicleBrand(vehicle.getBrand())
                .vehicleModel(vehicle.getModel())
                .vehicleYear(vehicle.getYear())
                .vehicleMileage(vehicle.getMileage())
                .licensePlate(vehicle.getLicensePlate())
                .nextCommittedServiceMileage(vehicle.getNextCommittedServiceMileage())
                .nextCommittedServiceDate(vehicle.getNextCommittedServiceDate());

        maintenanceRepository.findFirstByVehicle_IdOrderByServiceDateDescIdDesc(vehicleId).ifPresent(m -> {
            base.lastServiceDate(m.getServiceDate());
            base.lastServiceMileage(m.getMileageAtService());
        });

        Optional<MaintenancePlan> templatePlan = resolveTemplateMaintenancePlanForVehicle(vehicle, userId);
        if (templatePlan.isEmpty()) {
            return base.matchMode("NONE")
                    .resolvedPlanId(null)
                    .plan(null)
                    .hint("No hay plan con la misma marca, modelo y año que este vehículo, ni plan fijo activo en la unidad. "
                            + "Cargalo en Preventivo con esos mismos datos o asignalo fijo cuando lo habilites.")
                    .excludedPreventiveActivityIds(List.of())
                    .build();
        }

        MaintenancePlan template = templatePlan.get();
        Long templateId = template.getId();
        pruneVehiclePreventiveActivitiesAgainstTemplate(vehicleId, templateId, userId);

        List<VehiclePreventiveActivity> scopedActivities = vehiclePreventiveActivityRepository
                .findByVehicleIdAndResolvedPlanTemplateIdOrderByIntervaloKmAscIdAsc(vehicleId, templateId);

        boolean fixedMode =
                vehicle.getMaintenancePlan() != null
                        && Objects.equals(templateId, vehicle.getMaintenancePlan().getId());
        String mode = fixedMode ? "FIXED" : "MMY";
        String hint = fixedMode
                ? "Plan fijo asignado a esta unidad (evita emparejo automático)."
                : "Emparejo automático por marca, modelo y año del vehículo.";

        return base.matchMode(mode)
                .resolvedPlanId(templateId)
                .plan(toVehicleScopedPlanResponse(template, scopedActivities))
                .hint(hint)
                .excludedPreventiveActivityIds(List.of())
                .build();
    }

    private Optional<MaintenancePlan> resolveTemplateMaintenancePlanForVehicle(Vehicle vehicle, Long userId) {
        if (vehicle.getMaintenancePlan() != null) {
            Long pid = vehicle.getMaintenancePlan().getId();
            var fixed = planRepository.findByIdAndUserIdWithActivities(pid, userId)
                    .filter(p -> Boolean.TRUE.equals(p.getIsActive()));
            if (fixed.isPresent()) {
                return fixed;
            }
        }

        String bn = normalize(vehicle.getBrand());
        String mn = normalize(vehicle.getModel());
        Integer vy = vehicle.getYear();

        List<MaintenancePlan> matches = planRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .filter(p -> bn.equals(normalize(p.getMarca()))
                        && mn.equals(normalize(p.getModelo()))
                        && vy.equals(p.getAnio()))
                .sorted(Comparator
                        .comparing(MaintenancePlan::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(MaintenancePlan::getId).reversed())
                .collect(Collectors.toList());

        if (matches.isEmpty()) {
            return Optional.empty();
        }

        MaintenancePlan picked = matches.get(0);
        return planRepository.findByIdAndUserIdWithActivities(picked.getId(), userId).or(() -> Optional.of(picked));
    }

    /**
     * Alinea copias persistidas por placa cuando cambia el MMY aplicado / desactiva líneas si el origen ya no existe
     * en plantilla activa. No crea líneas nuevas: eso solo mediante {@link #incorporateTemplateActivitiesForVehicle}.
     */
    private void pruneVehiclePreventiveActivitiesAgainstTemplate(Long vehicleId, Long templatePlanId, Long userId) {
        planRepository.findByIdAndUserId(templatePlanId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", templatePlanId));

        vehiclePreventiveActivityRepository.deleteRowsForMismatchingTemplate(vehicleId, templatePlanId);

        List<MaintenancePlanActivity> templateActs =
                activityRepository.findByPlanIdAndIsActiveTrueOrderByIntervaloKmAsc(templatePlanId);

        Set<Long> activeTplIds =
                templateActs.stream().map(MaintenancePlanActivity::getId).collect(Collectors.toSet());

        List<VehiclePreventiveActivity> allRows = vehiclePreventiveActivityRepository
                .findByVehicleIdAndResolvedPlanTemplateIdOrderByIntervaloKmAscIdAsc(vehicleId, templatePlanId);
        for (VehiclePreventiveActivity row : allRows) {
            if (Boolean.FALSE.equals(row.getIsActive())) {
                continue;
            }
            if (row.getClonedFrom() != null && !activeTplIds.contains(row.getClonedFrom().getId())) {
                row.setIsActive(false);
                vehiclePreventiveActivityRepository.save(row);
            }
        }
    }

    /**
     * Suma por placa las actividades activas que la plantilla general tiene y esta unidad aún no tiene (clón).
     * Acción explícita del usuario (equivalente a lo que antes corría ocultamente en cada resolución).
     */
    @Transactional
    public void incorporateTemplateActivitiesForVehicle(Long vehicleId, Long userId) {
        var vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));
        Optional<MaintenancePlan> templateOpt = resolveTemplateMaintenancePlanForVehicle(vehicle, userId);
        if (templateOpt.isEmpty()) {
            throw new BadRequestException(
                    "Este vehículo no tiene plan preventivo MMY ni fijo. Asigná o emparejá la plantilla primero.");
        }
        MaintenancePlan template = templateOpt.get();
        incorporateMissingClonesFromTemplate(vehicleId, template.getId(), userId);
    }

    private void incorporateMissingClonesFromTemplate(Long vehicleId, Long templatePlanId, Long userId) {
        planRepository.findByIdAndUserId(templatePlanId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", templatePlanId));

        vehiclePreventiveActivityRepository.deleteRowsForMismatchingTemplate(vehicleId, templatePlanId);

        Vehicle vehicleEntity = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));

        List<MaintenancePlanActivity> templateActs =
                activityRepository.findByPlanIdAndIsActiveTrueOrderByIntervaloKmAsc(templatePlanId);

        Set<Long> activeTplIds =
                templateActs.stream().map(MaintenancePlanActivity::getId).collect(Collectors.toSet());

        var planRef = planRepository.getReferenceById(templatePlanId);

        for (MaintenancePlanActivity ta : templateActs) {
            Optional<VehiclePreventiveActivity> existingClone =
                    vehiclePreventiveActivityRepository.findByVehicleIdAndClonedFromId(vehicleId, ta.getId());
            if (existingClone.isEmpty()) {
                vehiclePreventiveActivityRepository.save(VehiclePreventiveActivity.builder()
                        .vehicle(vehicleEntity)
                        .resolvedPlanTemplate(planRef)
                        .clonedFrom(activityRepository.getReferenceById(ta.getId()))
                        .nombre(ta.getNombre())
                        .tipo(ta.getTipo())
                        .intervaloKm(ta.getIntervaloKm())
                        .intervaloMeses(ta.getIntervaloMeses())
                        .isActive(true)
                        .build());
            } else {
                VehiclePreventiveActivity row = existingClone.get();
                if (!Boolean.TRUE.equals(row.getIsActive())) {
                    row.setIsActive(true);
                    row.setResolvedPlanTemplate(planRef);
                    row.setNombre(ta.getNombre());
                    row.setTipo(ta.getTipo());
                    row.setIntervaloKm(ta.getIntervaloKm());
                    row.setIntervaloMeses(ta.getIntervaloMeses());
                    vehiclePreventiveActivityRepository.save(row);
                }
            }
        }

        List<VehiclePreventiveActivity> allRows = vehiclePreventiveActivityRepository
                .findByVehicleIdAndResolvedPlanTemplateIdOrderByIntervaloKmAscIdAsc(vehicleId, templatePlanId);
        for (VehiclePreventiveActivity row : allRows) {
            if (Boolean.FALSE.equals(row.getIsActive())) {
                continue;
            }
            if (row.getClonedFrom() != null && !activeTplIds.contains(row.getClonedFrom().getId())) {
                row.setIsActive(false);
                vehiclePreventiveActivityRepository.save(row);
            }
        }
    }

    @Transactional
    public MaintenancePlanActivityResponse addVehiclePreventiveActivity(
            Long vehicleId, MaintenancePlanActivityRequest request, Long userId) {
        Vehicle vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));
        Optional<MaintenancePlan> templateOpt = resolveTemplateMaintenancePlanForVehicle(vehicle, userId);
        if (templateOpt.isEmpty()) {
            throw new BadRequestException(
                    "Este vehículo no tiene un plan preventivo resuelto. Asignalo o emparejalo por MMY antes.");
        }
        MaintenancePlan template = templateOpt.get();
        var planRef = planRepository.getReferenceById(template.getId());
        MaintenancePlanActivity clonedFromTpl = null;
        if (request.getCloneFromPlanActivityId() != null) {
            clonedFromTpl = activityRepository.findById(request.getCloneFromPlanActivityId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Actividad de plantilla MMY", request.getCloneFromPlanActivityId()));
            if (!clonedFromTpl.getPlan().getId().equals(template.getId())) {
                throw new BadRequestException("La actividad de plantilla indicada no corresponde al plan MMY de esta unidad.");
            }
            Optional<VehiclePreventiveActivity> existingClone =
                    vehiclePreventiveActivityRepository.findByVehicleIdAndClonedFromId(vehicleId, clonedFromTpl.getId());
            if (existingClone.isPresent()) {
                VehiclePreventiveActivity row = existingClone.get();
                if (Boolean.TRUE.equals(row.getIsActive())) {
                    throw new BadRequestException("Esta línea del catálogo ya está incorporada en el libro de esta placa.");
                }
                row.setIsActive(true);
                row.setResolvedPlanTemplate(planRef);
                row.setNombre(request.getNombre());
                row.setTipo(request.getTipo());
                row.setIntervaloKm(request.getIntervaloKm());
                row.setIntervaloMeses(request.getIntervaloMeses());
                VehiclePreventiveActivity revived = vehiclePreventiveActivityRepository.save(row);
                return toVehiclePreventiveActivityResponse(revived);
            }
        }

        VehiclePreventiveActivity saved = vehiclePreventiveActivityRepository.save(VehiclePreventiveActivity.builder()
                .vehicle(vehicle)
                .resolvedPlanTemplate(planRef)
                .clonedFrom(clonedFromTpl)
                .nombre(request.getNombre())
                .tipo(request.getTipo())
                .intervaloKm(request.getIntervaloKm())
                .intervaloMeses(request.getIntervaloMeses())
                .isActive(true)
                .build());
        return toVehiclePreventiveActivityResponse(saved);
    }

    @Transactional
    public MaintenancePlanActivityResponse updateVehiclePreventiveActivity(
            Long vehicleId, Long activityId, MaintenancePlanActivityRequest request, Long userId) {
        VehiclePreventiveActivity v = vehiclePreventiveActivityRepository
                .findByIdVehicleAndOwner(activityId, vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad de unidad", activityId));
        v.setNombre(request.getNombre());
        v.setTipo(request.getTipo());
        v.setIntervaloKm(request.getIntervaloKm());
        v.setIntervaloMeses(request.getIntervaloMeses());
        return toVehiclePreventiveActivityResponse(vehiclePreventiveActivityRepository.save(v));
    }

    @Transactional
    public void deleteVehiclePreventiveActivity(Long vehicleId, Long activityId, Long userId) {
        VehiclePreventiveActivity v = vehiclePreventiveActivityRepository
                .findByIdVehicleAndOwner(activityId, vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad de unidad", activityId));
        v.setIsActive(false);
        vehiclePreventiveActivityRepository.save(v);
    }

    private static String normalize(String s) {
        if (s == null) {
            return "";
        }
        return s.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    public MaintenancePlanResponse getPlanById(Long id, Long userId) {
        var plan = planRepository.findByIdAndUserIdWithActivities(id, userId)
                .orElseGet(() -> planRepository.findByIdAndUserId(id, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Plan de mantenimiento", id)));
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

    private MaintenancePlanResponse toVehicleScopedPlanResponse(
            MaintenancePlan template, List<VehiclePreventiveActivity> scopedRows) {
        List<MaintenancePlanActivityResponse> activities = scopedRows.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .map(this::toVehiclePreventiveActivityResponse)
                .collect(Collectors.toList());

        return MaintenancePlanResponse.builder()
                .id(template.getId())
                .marca(template.getMarca())
                .modelo(template.getModelo())
                .anio(template.getAnio())
                .motor(template.getMotor())
                .tipoAceite(template.getTipoAceite())
                .fuente(template.getFuente())
                .isActive(template.getIsActive())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .activities(activities)
                .activityCount(activities.size())
                .build();
    }

    private MaintenancePlanActivityResponse toVehiclePreventiveActivityResponse(VehiclePreventiveActivity v) {
        Long cloneId = v.getClonedFrom() != null ? v.getClonedFrom().getId() : null;
        return MaintenancePlanActivityResponse.builder()
                .id(v.getId())
                .clonedFromPlanActivityId(cloneId)
                .nombre(v.getNombre())
                .tipo(v.getTipo())
                .intervaloKm(v.getIntervaloKm())
                .intervaloMeses(v.getIntervaloMeses())
                .isActive(v.getIsActive())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }

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
                .clonedFromPlanActivityId(null)
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
