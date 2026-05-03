package com.vehicle.maintenance.enums;

public enum TransmissionType {
    MANUAL("Manual"),
    AUTOMATIC("Automática"),
    CVT("CVT"),
    DCT("DCT");

    private final String displayName;

    TransmissionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
