-- Kilometraje opcional para clientes ocasionales / odómetro desconocido
ALTER TABLE maintenance
    ALTER COLUMN mileage_at_service DROP NOT NULL;

ALTER TABLE maintenance
    ADD COLUMN IF NOT EXISTS odometer_status VARCHAR(20) NOT NULL DEFAULT 'KNOWN';

ALTER TABLE maintenance
    ADD COLUMN IF NOT EXISTS service_category VARCHAR(20) NOT NULL DEFAULT 'MIXED';

COMMENT ON COLUMN maintenance.odometer_status IS 'KNOWN cuando hay km fiable; UNKNOWN sin odómetro; ESTIMADO declarado pero no verificado.';
COMMENT ON COLUMN maintenance.service_category IS 'PREVENTIVE, CORRECTIVE o MIXED.';
