CREATE TABLE maintenance (
    id                  BIGSERIAL PRIMARY KEY,
    vehicle_id          BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type        VARCHAR(100) NOT NULL,
    description         TEXT,
    mileage_at_service  INTEGER NOT NULL,
    cost                DECIMAL(10,2),
    service_date        DATE NOT NULL,
    next_service_mileage INTEGER,
    next_service_date   DATE,
    workshop_name       VARCHAR(200),
    workshop_address    VARCHAR(300),
    status              VARCHAR(20) DEFAULT 'completed',
    documents_url       TEXT,
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX idx_maintenance_user_id ON maintenance(user_id);
CREATE INDEX idx_maintenance_service_date ON maintenance(service_date);
CREATE INDEX idx_maintenance_status ON maintenance(status);
