package com.vehicle.maintenance.enums;

public enum MaintenanceStatus {
    DRAFT("Borrador"),
    QUOTE("Cotización"),
    SCHEDULED("Programado"),
    IN_PROGRESS("En Progreso"),
    COMPLETED("Completado"),
    CANCELLED("Cancelado");

    private final String displayName;

    MaintenanceStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
