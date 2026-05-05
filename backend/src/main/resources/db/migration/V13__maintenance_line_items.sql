CREATE TABLE maintenance_line_items (
    id                     BIGSERIAL PRIMARY KEY,
    maintenance_id         BIGINT NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
    line_type              VARCHAR(20) NOT NULL,
    description            TEXT NOT NULL,
    done                   BOOLEAN DEFAULT FALSE NOT NULL,
    included_in_record     BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order             INTEGER DEFAULT 0 NOT NULL,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_mli_maintenance_id ON maintenance_line_items(maintenance_id);

COMMENT ON TABLE maintenance_line_items IS 'Líneas de orden: recomendación preventiva, trabajo realizado o síntoma/falla.';
COMMENT ON COLUMN maintenance_line_items.line_type IS 'RECOMMENDED, PERFORMED o SYMPTOM';
COMMENT ON COLUMN maintenance_line_items.included_in_record IS 'Si false, solo referencia en UI o cotización sin acta definitiva';
