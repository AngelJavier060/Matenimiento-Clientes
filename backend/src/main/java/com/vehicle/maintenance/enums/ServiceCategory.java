package com.vehicle.maintenance.enums;

public enum ServiceCategory {
    PREVENTIVE("Preventivo"),
    CORRECTIVE("Correctivo"),
    MIXED("Mixto");

    private final String displayName;

    ServiceCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
