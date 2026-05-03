package com.vehicle.maintenance.util;

import com.vehicle.maintenance.config.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utilidades para obtener información del usuario autenticado desde el contexto de seguridad.
 */
public final class SecurityUtils {

    private SecurityUtils() {
        throw new UnsupportedOperationException("Clase utilitaria");
    }

    /**
     * Obtiene el ID del usuario autenticado desde el SecurityContext.
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Usuario no autenticado");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getUserId();
        }

        throw new IllegalStateException("No se pudo obtener el ID del usuario");
    }

    /**
     * Obtiene el email del usuario autenticado.
     */
    public static String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Usuario no autenticado");
        }
        return authentication.getName();
    }
}
