-- Crear tabla de clientes (independiente de usuarios del sistema)
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(500),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migrar datos existentes: clients que estaban como users
-- Si hay vehicles con client_id, creamos registros en clients a partir de los users referenciados
INSERT INTO clients (full_name, email, phone, created_at, updated_at)
SELECT DISTINCT u.full_name, u.email, u.phone, NOW(), NOW()
FROM vehicles v
JOIN users u ON u.id = v.client_id
WHERE v.client_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.full_name = u.full_name);

-- Actualizar vehicles.client_id para que apunte al nuevo client_id
UPDATE vehicles v
SET client_id = c.id
FROM clients c
WHERE c.full_name = (SELECT full_name FROM users WHERE id = v.client_id);

-- Eliminar la FK antigua de V8 (apuntaba a users) y crear la nueva (apunta a clients)
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_client;
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS fk_vehicles_client_ref;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_client_ref
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE SET NULL;
