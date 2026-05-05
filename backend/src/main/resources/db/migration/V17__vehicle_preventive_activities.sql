-- Copias por unidad del plan MMY/template: cargan al sincronizar; editar/borrar no afecta la plantilla global
CREATE TABLE vehicle_preventive_activities (
    id                       BIGSERIAL PRIMARY KEY,
    vehicle_id               BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    resolved_plan_template_id BIGINT NOT NULL REFERENCES maintenance_plans(id) ON DELETE CASCADE,
    cloned_from_activity_id   BIGINT REFERENCES maintenance_plan_activities(id) ON DELETE SET NULL,
    nombre                   VARCHAR(200) NOT NULL,
    tipo                     VARCHAR(5) NOT NULL,
    intervalo_km             INTEGER NOT NULL,
    intervalo_meses           INTEGER NOT NULL,
    is_active                BOOLEAN DEFAULT TRUE,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vpa_vehicle ON vehicle_preventive_activities(vehicle_id);
CREATE INDEX idx_vpa_vehicle_template ON vehicle_preventive_activities(vehicle_id, resolved_plan_template_id);

CREATE UNIQUE INDEX uq_vpa_vehicle_cloned
    ON vehicle_preventive_activities(vehicle_id, cloned_from_activity_id)
    WHERE cloned_from_activity_id IS NOT NULL;
