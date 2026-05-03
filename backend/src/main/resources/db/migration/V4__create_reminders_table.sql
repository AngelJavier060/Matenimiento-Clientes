CREATE TABLE reminders (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id          BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_id      BIGINT REFERENCES maintenance(id) ON DELETE SET NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    reminder_type       VARCHAR(50) NOT NULL,
    threshold_mileage   INTEGER,
    threshold_date      DATE,
    is_recurring        BOOLEAN DEFAULT FALSE,
    recurring_interval  INTEGER,
    last_notified       TIMESTAMP WITH TIME ZONE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_vehicle_id ON reminders(vehicle_id);
CREATE INDEX idx_reminders_active ON reminders(is_active);
CREATE INDEX idx_reminders_type ON reminders(reminder_type);
