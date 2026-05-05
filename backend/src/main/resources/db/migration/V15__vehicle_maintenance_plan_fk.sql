-- Plan preventivo opcional por vehículo (override manual cuando el taller lo asigna)
ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS maintenance_plan_id BIGINT REFERENCES maintenance_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_maintenance_plan_id ON vehicles(maintenance_plan_id);
