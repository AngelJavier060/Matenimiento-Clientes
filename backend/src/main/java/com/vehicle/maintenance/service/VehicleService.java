package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.vehicle.VehicleRequest;
import com.vehicle.maintenance.dto.vehicle.VehicleResponse;
import com.vehicle.maintenance.exception.BadRequestException;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.Client;
import com.vehicle.maintenance.model.MaintenancePlan;
import com.vehicle.maintenance.model.User;
import com.vehicle.maintenance.model.Vehicle;
import com.vehicle.maintenance.repository.ClientRepository;
import com.vehicle.maintenance.repository.MaintenancePlanRepository;
import com.vehicle.maintenance.repository.UserRepository;
import com.vehicle.maintenance.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final MaintenancePlanRepository maintenancePlanRepository;

    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<VehicleResponse> getAllVehicles(Long userId) {
        return vehicleRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<VehicleResponse> getVehiclesByClient(Long clientId) {
        return vehicleRepository.findByClientIdAndIsActiveTrueOrderByCreatedAtDesc(clientId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public VehicleResponse getVehicleById(Long id) {
        var vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", id));
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request, Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        // Si se especifica un client_id, verificar que existe
        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getClientId()));
        }

        var vehicle = Vehicle.builder()
                .user(user)
                .client(client)
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .licensePlate(request.getLicensePlate())
                .vin(request.getVin())
                .mileage(request.getMileage() != null ? request.getMileage() : 0)
                .fuelType(request.getFuelType())
                .transmission(request.getTransmission())
                .color(request.getColor())
                .imageUrl(request.getImageUrl())
                .notes(request.getNotes())
                .isActive(true)
                .build();

        if (request.isMaintenancePlanIdProvided()) {
            applyMaintenancePlanLink(vehicle, request.getMaintenancePlanId(), userId);
        }
        if (request.isNextCommittedServiceMileageProvided()) {
            vehicle.setNextCommittedServiceMileage(request.getNextCommittedServiceMileage());
        }
        if (request.isNextCommittedServiceDateProvided()) {
            vehicle.setNextCommittedServiceDate(request.getNextCommittedServiceDate());
        }

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleRequest request) {
        var vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", id));

        if (request.getBrand() != null) vehicle.setBrand(request.getBrand());
        if (request.getModel() != null) vehicle.setModel(request.getModel());
        if (request.getYear() != null) vehicle.setYear(request.getYear());
        if (request.getLicensePlate() != null) vehicle.setLicensePlate(request.getLicensePlate());
        if (request.getVin() != null) vehicle.setVin(request.getVin());
        if (request.getMileage() != null) vehicle.setMileage(request.getMileage());
        if (request.getFuelType() != null) vehicle.setFuelType(request.getFuelType());
        if (request.getTransmission() != null) vehicle.setTransmission(request.getTransmission());
        if (request.getColor() != null) vehicle.setColor(request.getColor());
        if (request.getImageUrl() != null) vehicle.setImageUrl(request.getImageUrl());
        if (request.getNotes() != null) vehicle.setNotes(request.getNotes());

        // Actualizar client_id si se proporciona
        if (request.getClientId() != null) {
            var client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.getClientId()));
            vehicle.setClient(client);
        }

        if (request.isMaintenancePlanIdProvided()) {
            applyMaintenancePlanLink(vehicle, request.getMaintenancePlanId(), vehicle.getUser().getId());
        }
        if (request.isNextCommittedServiceMileageProvided()) {
            vehicle.setNextCommittedServiceMileage(request.getNextCommittedServiceMileage());
        }
        if (request.isNextCommittedServiceDateProvided()) {
            vehicle.setNextCommittedServiceDate(request.getNextCommittedServiceDate());
        }

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long id) {
        var vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", id));

        vehicle.setIsActive(false);
        vehicleRepository.save(vehicle);
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return VehicleResponse.builder()
                .id(vehicle.getId())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .licensePlate(vehicle.getLicensePlate())
                .vin(vehicle.getVin())
                .mileage(vehicle.getMileage())
                .fuelType(vehicle.getFuelType())
                .transmission(vehicle.getTransmission())
                .color(vehicle.getColor())
                .imageUrl(vehicle.getImageUrl())
                .clientId(vehicle.getClient() != null ? vehicle.getClient().getId() : null)
                .clientName(vehicle.getClient() != null ? vehicle.getClient().getFullName() : null)
                .notes(vehicle.getNotes())
                .isActive(vehicle.getIsActive())
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .maintenanceCount(vehicle.getMaintenances() != null ? vehicle.getMaintenances().size() : 0)
                .maintenancePlanId(vehicle.getMaintenancePlan() != null ? vehicle.getMaintenancePlan().getId() : null)
                .nextCommittedServiceMileage(vehicle.getNextCommittedServiceMileage())
                .nextCommittedServiceDate(vehicle.getNextCommittedServiceDate())
                .build();
    }

    private void applyMaintenancePlanLink(Vehicle vehicle, Long maintenancePlanId, Long userId) {
        if (maintenancePlanId == null) {
            vehicle.setMaintenancePlan(null);
            return;
        }
        MaintenancePlan plan = maintenancePlanRepository.findByIdAndUserId(maintenancePlanId, userId)
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .orElseThrow(() -> new BadRequestException(
                        "Plan de mantenimiento inválido, inactivo o no pertenece a su usuario."));
        vehicle.setMaintenancePlan(plan);
    }
}
