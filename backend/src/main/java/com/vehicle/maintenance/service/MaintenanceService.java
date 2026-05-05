package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.maintenance.MaintenanceLineRequest;
import com.vehicle.maintenance.dto.maintenance.MaintenanceLineResponse;
import com.vehicle.maintenance.dto.maintenance.MaintenanceRequest;
import com.vehicle.maintenance.dto.maintenance.MaintenanceResponse;
import com.vehicle.maintenance.enums.MaintenanceLineType;
import com.vehicle.maintenance.enums.MaintenanceStatus;
import com.vehicle.maintenance.enums.OdometerStatus;
import com.vehicle.maintenance.enums.ServiceCategory;
import com.vehicle.maintenance.exception.BadRequestException;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.Maintenance;
import com.vehicle.maintenance.model.MaintenanceLineItem;
import com.vehicle.maintenance.model.Vehicle;
import com.vehicle.maintenance.repository.MaintenanceRepository;
import com.vehicle.maintenance.repository.UserRepository;
import com.vehicle.maintenance.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ReminderAutoSyncService reminderAutoSyncService;

    public List<MaintenanceResponse> getMaintenancesByVehicle(Long vehicleId, Long userId) {
        var vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));

        return maintenanceRepository.findByVehicleIdOrderByServiceDateDesc(vehicle.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MaintenanceResponse> getAllUserMaintenances(Long userId) {
        return maintenanceRepository.findByUserIdOrderByServiceDateDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public MaintenanceResponse getMaintenanceById(Long id, Long userId) {
        var maintenance = maintenanceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Mantenimiento", id));
        return toResponse(maintenance);
    }

    @Transactional
    public MaintenanceResponse createMaintenance(MaintenanceRequest request, Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        var vehicle = vehicleRepository.findByIdAndUserId(request.getVehicleId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", request.getVehicleId()));

        OdometerStatus odometer = resolveOdometer(request);
        validateOdometerConsistency(request.getMileageAtService(), odometer);
        validateMileageAheadOfFleetOdometer(vehicle.getMileage(), request.getMileageAtService(), odometer);

        ServiceCategory category = Objects.requireNonNullElse(
                request.getServiceCategory(),
                ServiceCategory.MIXED
        );

        var maintenance = Maintenance.builder()
                .vehicle(vehicle)
                .user(user)
                .serviceType(request.getServiceType())
                .description(request.getDescription())
                .mileageAtService(request.getMileageAtService())
                .odometerStatus(odometer)
                .serviceCategory(category)
                .cost(request.getCost())
                .serviceDate(request.getServiceDate())
                .nextServiceMileage(request.getNextServiceMileage())
                .nextServiceDate(request.getNextServiceDate())
                .workshopName(request.getWorkshopName())
                .workshopAddress(request.getWorkshopAddress())
                .status(Optional.ofNullable(request.getStatus()).orElse(MaintenanceStatus.COMPLETED))
                .documentsUrl(request.getDocumentsUrl())
                .notes(request.getNotes())
                .build();

        syncLineItems(maintenance, Optional.ofNullable(request.getLineItems()).orElse(List.of()));

        maintenance = maintenanceRepository.save(maintenance);
        updateVehicleOdometerIfTrusted(vehicle, request.getMileageAtService(), odometer);

        reminderAutoSyncService.syncAutoReminderForVehicle(vehicle.getId());

        return toResponse(maintenance);
    }

    @Transactional
    public MaintenanceResponse updateMaintenance(Long id, MaintenanceRequest request, Long userId) {
        var maintenance = maintenanceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Mantenimiento", id));

        Vehicle vehicle = maintenance.getVehicle();
        if (!vehicle.getId().equals(request.getVehicleId())) {
            vehicle = vehicleRepository.findByIdAndUserId(request.getVehicleId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehículo", request.getVehicleId()));
            maintenance.setVehicle(vehicle);
        }

        OdometerStatus odometer = resolveOdometer(request);
        validateOdometerConsistency(request.getMileageAtService(), odometer);

        maintenance.setServiceType(request.getServiceType());
        maintenance.setDescription(request.getDescription());
        maintenance.setMileageAtService(request.getMileageAtService());
        maintenance.setOdometerStatus(odometer);
        maintenance.setServiceCategory(Objects.requireNonNullElse(request.getServiceCategory(), ServiceCategory.MIXED));
        maintenance.setCost(request.getCost());
        maintenance.setServiceDate(request.getServiceDate());
        maintenance.setNextServiceMileage(request.getNextServiceMileage());
        maintenance.setNextServiceDate(request.getNextServiceDate());
        maintenance.setWorkshopName(request.getWorkshopName());
        maintenance.setWorkshopAddress(request.getWorkshopAddress());
        maintenance.setStatus(Optional.ofNullable(request.getStatus()).orElse(maintenance.getStatus()));
        maintenance.setDocumentsUrl(request.getDocumentsUrl());
        maintenance.setNotes(request.getNotes());

        syncLineItems(maintenance, Optional.ofNullable(request.getLineItems()).orElse(List.of()));

        maintenance = maintenanceRepository.save(maintenance);
        updateVehicleOdometerIfTrusted(vehicle, request.getMileageAtService(), odometer);

        reminderAutoSyncService.syncAutoReminderForVehicle(vehicle.getId());

        return toResponse(maintenance);
    }

    @Transactional
    public void deleteMaintenance(Long id, Long userId) {
        var maintenance = maintenanceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Mantenimiento", id));
        Long vehicleId = maintenance.getVehicle().getId();
        maintenanceRepository.delete(maintenance);
        reminderAutoSyncService.syncAutoReminderForVehicle(vehicleId);
    }

    private OdometerStatus resolveOdometer(MaintenanceRequest request) {
        if (request.getOdometerStatus() != null) {
            return request.getOdometerStatus();
        }
        return request.getMileageAtService() != null ? OdometerStatus.KNOWN : OdometerStatus.UNKNOWN;
    }

    private void validateOdometerConsistency(Integer mileage, OdometerStatus odometer) {
        Objects.requireNonNull(odometer, "odometerStatus");
        if (mileage == null && odometer != OdometerStatus.UNKNOWN) {
            throw new BadRequestException("Sin kilometraje debe usarse estado de odómetro UNKNOWN");
        }
        if (mileage != null && odometer == OdometerStatus.UNKNOWN) {
            throw new BadRequestException("No puede usarse UNKNOWN si informó kilometraje");
        }
        if (odometer == OdometerStatus.ESTIMATED && mileage == null) {
            throw new BadRequestException("Con odómetro ESTIMATED debe indicar un valor aproximado de km");
        }
    }

    /**
     * En altas nuevas: evita repetir el kilometraje de ficha como “servicio nuevo” cuando el odómetro
     * debe avanzar (KNOWN o ESTIMATED). UNKNOWN no registra valor y no participa aquí.
     */
    private void validateMileageAheadOfFleetOdometer(
            Integer fleetOdometer, Integer mileageAtService, OdometerStatus od) {
        if (fleetOdometer == null || mileageAtService == null || od == OdometerStatus.UNKNOWN) {
            return;
        }
        if (mileageAtService <= fleetOdometer) {
            throw new BadRequestException(
                    "El kilometraje del servicio (" + mileageAtService
                            + " km) debe ser mayor al último odómetro en ficha (" + fleetOdometer
                            + " km). Si todavía no hay lectura nueva, use estado de odómetro UNKNOWN.");
        }
    }

    private void updateVehicleOdometerIfTrusted(Vehicle vehicle, Integer mileageAtService, OdometerStatus odometer) {
        if (mileageAtService == null || odometer != OdometerStatus.KNOWN) {
            return;
        }
        int current = Optional.ofNullable(vehicle.getMileage()).orElse(0);
        if (mileageAtService > current) {
            vehicle.setMileage(mileageAtService);
            vehicleRepository.save(vehicle);
        }
    }

    private void syncLineItems(Maintenance maintenance, List<MaintenanceLineRequest> requests) {
        maintenance.getLineItems().clear();

        List<MaintenanceLineRequest> sanitized = sanitizeLineRequests(requests);
        int order = 0;
        for (MaintenanceLineRequest req : sanitized) {
            MaintenanceLineItem item = MaintenanceLineItem.builder()
                    .maintenance(maintenance)
                    .lineType(Optional.ofNullable(req.getLineType()).orElse(MaintenanceLineType.PERFORMED))
                    .description(req.getDescription().trim())
                    .done(Optional.ofNullable(req.getDone()).orElse(false))
                    .includedInRecord(Optional.ofNullable(req.getIncludedInRecord()).orElse(true))
                    .sortOrder(Optional.ofNullable(req.getSortOrder()).orElse(order))
                    .build();
            maintenance.getLineItems().add(item);
            order++;
        }
    }

    private List<MaintenanceLineRequest> sanitizeLineRequests(List<MaintenanceLineRequest> requests) {
        if (requests == null) {
            return List.of();
        }
        List<MaintenanceLineRequest> out = new ArrayList<>();
        for (MaintenanceLineRequest r : requests) {
            if (r == null || r.getDescription() == null || r.getDescription().isBlank()) {
                continue;
            }
            MaintenanceLineRequest copy = MaintenanceLineRequest.builder()
                    .id(r.getId())
                    .lineType(r.getLineType())
                    .description(r.getDescription())
                    .done(r.getDone())
                    .includedInRecord(r.getIncludedInRecord())
                    .sortOrder(r.getSortOrder())
                    .build();
            out.add(copy);
        }
        return out;
    }

    private MaintenanceResponse toResponse(Maintenance m) {
        Vehicle v = m.getVehicle();
        String platePart = Optional.ofNullable(v.getLicensePlate())
                .map(p -> " (" + p + ")")
                .orElse("");

        List<MaintenanceLineResponse> lines = Optional.ofNullable(m.getLineItems())
                .map(items -> items.stream()
                        .map(li -> MaintenanceLineResponse.builder()
                                .id(li.getId())
                                .lineType(li.getLineType())
                                .description(li.getDescription())
                                .done(li.getDone())
                                .includedInRecord(li.getIncludedInRecord())
                                .sortOrder(li.getSortOrder())
                                .build())
                        .collect(Collectors.toList()))
                .orElse(List.of());

        return MaintenanceResponse.builder()
                .id(m.getId())
                .vehicleId(v.getId())
                .vehicleInfo(v.getBrand() + " " + v.getModel() + platePart)
                .serviceType(m.getServiceType())
                .description(m.getDescription())
                .mileageAtService(m.getMileageAtService())
                .odometerStatus(m.getOdometerStatus())
                .serviceCategory(m.getServiceCategory())
                .cost(m.getCost())
                .serviceDate(m.getServiceDate())
                .nextServiceMileage(m.getNextServiceMileage())
                .nextServiceDate(m.getNextServiceDate())
                .workshopName(m.getWorkshopName())
                .workshopAddress(m.getWorkshopAddress())
                .status(m.getStatus())
                .documentsUrl(m.getDocumentsUrl())
                .notes(m.getNotes())
                .lineItems(lines)
                .createdAt(m.getCreatedAt())
                .build();
    }
}
