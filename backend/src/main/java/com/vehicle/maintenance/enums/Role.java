package com.vehicle.maintenance.enums;

public enum Role {
    SUPER_ADMIN("Super Administrador"),
    ADMIN("Administrador"),
    USER("Usuario");

    private final String displayName;

    Role(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
