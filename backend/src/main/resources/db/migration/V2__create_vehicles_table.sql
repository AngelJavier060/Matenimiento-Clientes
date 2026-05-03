CREATE TABLE vehicles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand           VARCHAR(100) NOT NULL,
    model           VARCHAR(100) NOT NULL,
    year            INTEGER NOT NULL,
    license_plate   VARCHAR(20) UNIQUE,
    vin             VARCHAR(17),
    mileage         INTEGER DEFAULT 0,
    fuel_type       VARCHAR(20),
    transmission    VARCHAR(20),
    color           VARCHAR(50),
    notes           TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
