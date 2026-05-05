package com.vehicle.maintenance.enums;

public enum OdometerStatus {
    KNOWN("Km conocido / verificado"),
    UNKNOWN("Odómetro desconocido"),
    ESTIMATED("Km estimado");

    private final String displayName;

    OdometerStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
