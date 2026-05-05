-- Recordatorios generados por el sistema (próximo servicio desde mantenimiento)
ALTER TABLE reminders
    ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN reminders.auto_generated IS 'true si se creó/actualiza automáticamente desde un mantenimiento (próximo servicio)';
