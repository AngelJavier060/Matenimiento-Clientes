package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.vehicle.VehicleRequest;
import com.vehicle.maintenance.dto.vehicle.VehicleResponse;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.User;
import com.vehicle.maintenance.model.Vehicle;
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

    public List<VehicleResponse> getAllVehicles(Long userId) {
        return vehicleRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public VehicleResponse getVehicleById(Long id, Long userId) {
        var vehicle = vehicleRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", id));
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse createVehicle(VehicleRequest request, Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        var vehicle = Vehicle.builder()
                .user(user)
                .brand(request.getBrand())
                .model(request.getModel())
                .year(request.getYear())
                .licensePlate(request.getLicensePlate())
                .vin(request.getVin())
                .mileage(request.getMileage() != null ? request.getMileage() : 0)
                .fuelType(request.getFuelType())
                .transmission(request.getTransmission())
                .color(request.getColor())
                .notes(request.getNotes())
                .isActive(true)
                .build();

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public VehicleResponse updateVehicle(Long id, VehicleRequest request, Long userId) {
        var vehicle = vehicleRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo", id));

        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setVin(request.getVin());
        vehicle.setMileage(request.getMileage() != null ? request.getMileage() : vehicle.getMileage());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setTransmission(request.getTransmission());
        vehicle.setColor(request.getColor());
        vehicle.setNotes(request.getNotes());

        vehicle = vehicleRepository.save(vehicle);
        return toResponse(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long id, Long userId) {
        var vehicle = vehicleRepository.findByIdAndUserId(id, userId)
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
                .notes(vehicle.getNotes())
                .isActive(vehicle.getIsActive())
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .maintenanceCount(vehicle.getMaintenances() != null ? vehicle.getMaintenances().size() : 0)
                .build();
    }
}
