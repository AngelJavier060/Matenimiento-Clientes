package com.vehicle.maintenance.dto.user;

import com.vehicle.maintenance.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(min = 3, max = 150, message = "El nombre debe tener entre 3 y 150 caracteres")
    private String fullName;

    @Email(message = "Formato de email inválido")
    private String email;

    private Role role;

    @Size(max = 20, message = "El documento no puede exceder 20 caracteres")
    private String documentId;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String phone;

    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String address;

    private String avatarUrl;

    private Boolean isActive;

    // Solo para SUPER_ADMIN: permite resetear contraseña
    @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
    private String newPassword;
}
