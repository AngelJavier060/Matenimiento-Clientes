CREATE TABLE maintenance_plans (
    id          BIGSERIAL PRIMARY KEY,
    marca       VARCHAR(100) NOT NULL,
    modelo      VARCHAR(100) NOT NULL,
    anio        INTEGER NOT NULL,
    motor       VARCHAR(100) DEFAULT '',
    tipo_aceite VARCHAR(100) DEFAULT '',
    fuente      VARCHAR(200) DEFAULT 'Usuario',
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_plan_activities (
    id               BIGSERIAL PRIMARY KEY,
    plan_id          BIGINT NOT NULL REFERENCES maintenance_plans(id) ON DELETE CASCADE,
    nombre           VARCHAR(200) NOT NULL,
    tipo             VARCHAR(5) NOT NULL,
    intervalo_km     INTEGER NOT NULL,
    intervalo_meses  INTEGER NOT NULL,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mp_user_id ON maintenance_plans(user_id);
CREATE INDEX idx_mpa_plan_id ON maintenance_plan_activities(plan_id);
CREATE INDEX idx_mpa_intervalo_km ON maintenance_plan_activities(intervalo_km);
