-- Agregar columna de rol
ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Agregar documento de identidad (DNI/NIF/CIF)
ALTER TABLE users
    ADD COLUMN document_id VARCHAR(20);

-- Agregar dirección
ALTER TABLE users
    ADD COLUMN address VARCHAR(255);

-- Agregar última fecha de inicio de sesión
ALTER TABLE users
    ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Índices
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_document_id ON users(document_id);
