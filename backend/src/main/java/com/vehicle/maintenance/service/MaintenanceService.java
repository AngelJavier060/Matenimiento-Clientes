package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.maintenance.MaintenanceRequest;
import com.vehicle.maintenance.dto.maintenance.MaintenanceResponse;
import com.vehicle.maintenance.enums.MaintenanceStatus;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.Maintenance;
import com.vehicle.maintenance.repository.MaintenanceRepository;
import com.vehicle.maintenance.repository.UserRepository;
import com.vehicle.maintenance.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public List<MaintenanceResponse> getMaintenancesByVehicle(Long vehicleId, Long userId) {
        // Verificar que el vehículo pertenece al usuario
        var vehicle = vehicleRepository.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", vehicleId));

        return maintenanceRepository.findByVehicleIdOrderByServiceDateDesc(vehicleId)
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

        var maintenance = Maintenance.builder()
                .vehicle(vehicle)
                .user(user)
                .serviceType(request.getServiceType())
                .description(request.getDescription())
                .mileageAtService(request.getMileageAtService())
                .cost(request.getCost())
                .serviceDate(request.getServiceDate())
                .nextServiceMileage(request.getNextServiceMileage())
                .nextServiceDate(request.getNextServiceDate())
                .workshopName(request.getWorkshopName())
                .workshopAddress(request.getWorkshopAddress())
                .status(request.getStatus() != null ? request.getStatus() : MaintenanceStatus.COMPLETED)
                .documentsUrl(request.getDocumentsUrl())
                .notes(request.getNotes())
                .build();

        maintenance = maintenanceRepository.save(maintenance);

        // Actualizar kilometraje del vehículo si el nuevo es mayor
        if (request.getMileageAtService() > vehicle.getMileage()) {
            vehicle.setMileage(request.getMileageAtService());
            vehicleRepository.save(vehicle);
        }

        return toResponse(maintenance);
    }

    @Transactional
    public MaintenanceResponse updateMaintenance(Long id, MaintenanceRequest request, Long userId) {
        var maintenance = maintenanceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Mantenimiento", id));

        // Si cambia el vehículo, verificar que pertenece al usuario
        if (!maintenance.getVehicle().getId().equals(request.getVehicleId())) {
            var newVehicle = vehicleRepository.findByIdAndUserId(request.getVehicleId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehículo", request.getVehicleId()));
            maintenance.setVehicle(newVehicle);
        }

        maintenance.setServiceType(request.getServiceType());
        maintenance.setDescription(request.getDescription());
        maintenance.setMileageAtService(request.getMileageAtService());
        maintenance.setCost(request.getCost());
        maintenance.setServiceDate(request.getServiceDate());
        maintenance.setNextServiceMileage(request.getNextServiceMileage());
        maintenance.setNextServiceDate(request.getNextServiceDate());
        maintenance.setWorkshopName(request.getWorkshopName());
        maintenance.setWorkshopAddress(request.getWorkshopAddress());
        maintenance.setStatus(request.getStatus() != null ? request.getStatus() : maintenance.getStatus());
        maintenance.setDocumentsUrl(request.getDocumentsUrl());
        maintenance.setNotes(request.getNotes());

        maintenance = maintenanceRepository.save(maintenance);
        return toResponse(maintenance);
    }

    @Transactional
    public void deleteMaintenance(Long id, Long userId) {
        var maintenance = maintenanceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Mantenimiento", id));
        maintenanceRepository.delete(maintenance);
    }

    private MaintenanceResponse toResponse(Maintenance m) {
        return MaintenanceResponse.builder()
                .id(m.getId())
                .vehicleId(m.getVehicle().getId())
                .vehicleInfo(m.getVehicle().getBrand() + " " + m.getVehicle().getModel()
                        + " (" + m.getVehicle().getLicensePlate() + ")")
                .serviceType(m.getServiceType())
                .description(m.getDescription())
                .mileageAtService(m.getMileageAtService())
                .cost(m.getCost())
                .serviceDate(m.getServiceDate())
                .nextServiceMileage(m.getNextServiceMileage())
                .nextServiceDate(m.getNextServiceDate())
                .workshopName(m.getWorkshopName())
                .workshopAddress(m.getWorkshopAddress())
                .status(m.getStatus())
                .documentsUrl(m.getDocumentsUrl())
                .notes(m.getNotes())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
