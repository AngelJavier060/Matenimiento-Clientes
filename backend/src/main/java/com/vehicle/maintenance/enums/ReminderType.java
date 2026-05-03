package com.vehicle.maintenance.enums;

public enum ReminderType {
    MILEAGE_BASED("Basado en Kilometraje"),
    DATE_BASED("Basado en Fecha"),
    BOTH("Ambos");

    private final String displayName;

    ReminderType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
