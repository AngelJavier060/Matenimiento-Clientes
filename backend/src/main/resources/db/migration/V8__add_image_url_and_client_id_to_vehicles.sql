-- Agregar image_url para fotos del vehículo
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Agregar client_id para asociar vehículo al cliente propietario
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS client_id BIGINT;

-- Clave foránea: el vehículo pertenece a un cliente
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_client
    FOREIGN KEY (client_id) REFERENCES users(id)
    ON DELETE SET NULL;
