package com.vehicle.maintenance.service;

import com.vehicle.maintenance.dto.user.UpdatePasswordRequest;
import com.vehicle.maintenance.dto.user.UpdateUserRequest;
import com.vehicle.maintenance.dto.user.UserResponse;
import com.vehicle.maintenance.enums.Role;
import com.vehicle.maintenance.exception.BadRequestException;
import com.vehicle.maintenance.exception.ResourceNotFoundException;
import com.vehicle.maintenance.exception.UnauthorizedException;
import com.vehicle.maintenance.model.User;
import com.vehicle.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Obtiene todos los usuarios activos.
     * Solo SUPER_ADMIN y ADMIN pueden listar usuarios.
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(Long currentUserId) {
        User currentUser = findUserById(currentUserId);

        // SUPER_ADMIN ve todos los usuarios; ADMIN ve solo usuarios normales
        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            return userRepository.findAll().stream()
                    .map(this::toUserResponse)
                    .toList();
        } else if (currentUser.getRole() == Role.ADMIN) {
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole() != Role.SUPER_ADMIN)
                    .map(this::toUserResponse)
                    .toList();
        }

        throw new UnauthorizedException("No tienes permisos para listar usuarios");
    }

    /**
     * Obtiene un usuario por ID.
     * SUPER_ADMIN y ADMIN pueden ver cualquier usuario (no SUPER_ADMIN para ADMIN).
     * Un USER solo puede verse a sí mismo.
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, Long currentUserId) {
        User currentUser = findUserById(currentUserId);
        User targetUser = findUserById(id);

        // Validar permisos
        if (currentUser.getRole() == Role.USER && !currentUserId.equals(id)) {
            throw new UnauthorizedException("No puedes ver información de otros usuarios");
        }
        if (currentUser.getRole() == Role.ADMIN && targetUser.getRole() == Role.SUPER_ADMIN) {
            throw new UnauthorizedException("No puedes ver información de super administradores");
        }

        return toUserResponse(targetUser);
    }

    /**
     * Actualiza un usuario.
     * SUPER_ADMIN puede actualizar cualquier usuario.
     * ADMIN puede actualizar usuarios normales.
     * USER solo puede actualizarse a sí mismo (campos básicos).
     */
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, Long currentUserId) {
        User currentUser = findUserById(currentUserId);
        User targetUser = findUserById(id);

        validateAccess(currentUser, targetUser, "actualizar");

        // Si el usuario actual no es SUPER_ADMIN, no puede cambiar roles
        if (request.getRole() != null && currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new UnauthorizedException("Solo un super administrador puede cambiar roles");
        }

        // No permitir que un ADMIN se autopromocione a SUPER_ADMIN
        if (request.getRole() == Role.SUPER_ADMIN && currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new UnauthorizedException("No tienes permisos para asignar el rol SUPER_ADMIN");
        }

        // Si es USER auto-editándose, solo puede cambiar campos básicos
        if (currentUser.getRole() == Role.USER && currentUserId.equals(id)) {
            if (request.getRole() != null || request.getDocumentId() != null) {
                throw new UnauthorizedException("No puedes modificar roles ni documento de identidad");
            }
        }

        if (request.getFullName() != null) {
            targetUser.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(targetUser.getEmail()) &&
                    userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("El email ya está en uso");
            }
            targetUser.setEmail(request.getEmail());
        }
        if (request.getRole() != null) {
            targetUser.setRole(request.getRole());
        }
        if (request.getDocumentId() != null) {
            targetUser.setDocumentId(request.getDocumentId());
        }
        if (request.getPhone() != null) {
            targetUser.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            targetUser.setAddress(request.getAddress());
        }
        if (request.getAvatarUrl() != null) {
            targetUser.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getIsActive() != null) {
            targetUser.setIsActive(request.getIsActive());
        }

        // SUPER_ADMIN puede resetear contraseñas
        if (request.getNewPassword() != null && currentUser.getRole() == Role.SUPER_ADMIN) {
            targetUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(targetUser);
        return toUserResponse(targetUser);
    }

    /**
     * Cambia la contraseña del usuario.
     */
    @Transactional
    public void updatePassword(Long id, UpdatePasswordRequest request, Long currentUserId) {
        if (!currentUserId.equals(id)) {
            throw new UnauthorizedException("Solo puedes cambiar tu propia contraseña");
        }

        User user = findUserById(id);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Desactiva (soft delete) o activa un usuario.
     * Solo SUPER_ADMIN puede desactivar a ADMIN.
     */
    @Transactional
    public void toggleUserStatus(Long id, Long currentUserId) {
        User currentUser = findUserById(currentUserId);
        User targetUser = findUserById(id);

        validateAccess(currentUser, targetUser, "cambiar estado");

        // No permitir desactivarse a sí mismo
        if (currentUserId.equals(id)) {
            throw new BadRequestException("No puedes cambiar tu propio estado");
        }

        targetUser.setIsActive(!Boolean.TRUE.equals(targetUser.getIsActive()));
        userRepository.save(targetUser);
    }

    /**
     * Elimina permanentemente un usuario.
     * Solo SUPER_ADMIN puede eliminar usuarios.
     */
    @Transactional
    public void deleteUser(Long id, Long currentUserId) {
        User currentUser = findUserById(currentUserId);

        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new UnauthorizedException("Solo un super administrador puede eliminar usuarios");
        }

        if (currentUserId.equals(id)) {
            throw new BadRequestException("No puedes eliminarte a ti mismo");
        }

        User targetUser = findUserById(id);

        if (targetUser.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("No puedes eliminar a otro super administrador");
        }

        userRepository.delete(targetUser);
    }

    /**
     * Actualiza el lastLogin del usuario.
     */
    @Transactional
    public void updateLastLogin(Long userId) {
        User user = findUserById(userId);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Actualiza solo el avatar URL de un usuario (usado por UploadController).
     */
    @Transactional
    public void updateAvatarUrl(Long userId, String avatarUrl) {
        User user = findUserById(userId);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
    }

    // ===== Métodos privados =====

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
    }

    private void validateAccess(User currentUser, User targetUser, String action) {
        if (currentUser.getRole() == Role.USER && !currentUser.getId().equals(targetUser.getId())) {
            throw new UnauthorizedException("No tienes permisos para " + action + " este usuario");
        }
        if (currentUser.getRole() == Role.ADMIN && targetUser.getRole() == Role.SUPER_ADMIN) {
            throw new UnauthorizedException("No puedes " + action + " un super administrador");
        }
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .documentId(user.getDocumentId())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
