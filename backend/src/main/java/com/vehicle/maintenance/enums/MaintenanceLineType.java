package com.vehicle.maintenance.enums;

public enum MaintenanceLineType {
    /** Tarea o ítem recomendado (preventivo). */
    RECOMMENDED("Recomendado"),
    /** Trabajo ejecutado / facturable. */
    PERFORMED("Realizado"),
    /** Falla, síntoma o diagnóstico reportado (correctivo). */
    SYMPTOM("Falla/Síntoma");

    private final String displayName;

    MaintenanceLineType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
