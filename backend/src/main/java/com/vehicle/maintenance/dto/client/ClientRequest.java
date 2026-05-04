package com.vehicle.maintenance.dto.client;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRequest {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(max = 255, message = "El nombre no puede exceder 255 caracteres")
    private String fullName;

    private String email;

    @Size(max = 50, message = "El teléfono no puede exceder 50 caracteres")
    private String phone;

    @Size(max = 500, message = "La dirección no puede exceder 500 caracteres")
    private String address;

    private String notes;

    private String status;
}
