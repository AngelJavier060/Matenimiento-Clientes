-- Líneas del plan preventivo desactivadas por placa (no borran la plantilla MMY)
CREATE TABLE vehicle_plan_activity_exclusions (
    id                 BIGSERIAL PRIMARY KEY,
    vehicle_id         BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    plan_activity_id   BIGINT NOT NULL REFERENCES maintenance_plan_activities(id) ON DELETE CASCADE,
    CONSTRAINT uq_vae_vehicle_activity UNIQUE (vehicle_id, plan_activity_id)
);

CREATE INDEX idx_vae_vehicle ON vehicle_plan_activity_exclusions(vehicle_id);
