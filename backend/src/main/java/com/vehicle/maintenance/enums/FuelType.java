package com.vehicle.maintenance.enums;

public enum FuelType {
    GASOLINE("Gasolina"),
    DIESEL("Diesel"),
    ELECTRIC("Eléctrico"),
    HYBRID("Híbrido"),
    LPG("GLP"),
    CNG("GNC");

    private final String displayName;

    FuelType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
