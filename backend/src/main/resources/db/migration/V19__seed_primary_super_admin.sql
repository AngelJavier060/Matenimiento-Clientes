-- Superusuario principal (prod / instalación nueva). Contraseña: Alexandra123@
-- BCrypt strength 10. Si el email ya existe, se fuerza rol y contraseña.
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'angeljaviermsn@gmail.com',
    '$2b$10$ZOQvtVaT1RQNtc4t8jjoQefO2/ZBiN0PFhZDCo6cWUU6NNy1zFYdC',
    'Angel Javier',
    'SUPER_ADMIN',
    TRUE
)
ON CONFLICT (email)
DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name     = EXCLUDED.full_name,
    role          = EXCLUDED.role,
    is_active     = EXCLUDED.is_active,
    updated_at    = CURRENT_TIMESTAMP;
