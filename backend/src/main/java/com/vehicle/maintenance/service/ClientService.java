package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.client.ClientRequest;
import com.vehicle.maintenance.dto.client.ClientResponse;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.model.Client;
import com.vehicle.maintenance.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;

    public List<ClientResponse> getAllClients() {
        return clientRepository.findByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ClientResponse getClientById(Long id) {
        var client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        return toResponse(client);
    }

    @Transactional
    public ClientResponse createClient(ClientRequest request) {
        var client = Client.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : "activo")
                .build();

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Transactional
    public ClientResponse updateClient(Long id, ClientRequest request) {
        var client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));

        client.setFullName(request.getFullName());
        client.setEmail(request.getEmail());
        client.setPhone(request.getPhone());
        client.setAddress(request.getAddress());
        client.setNotes(request.getNotes());
        if (request.getStatus() != null) {
            client.setStatus(request.getStatus());
        }

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Transactional
    public void deleteClient(Long id) {
        var client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
        clientRepository.delete(client);
    }

    private ClientResponse toResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .fullName(client.getFullName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .address(client.getAddress())
                .notes(client.getNotes())
                .status(client.getStatus())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }
}
