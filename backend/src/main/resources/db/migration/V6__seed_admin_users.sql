-- Asignar rol SUPER_ADMIN al primer usuario (dueño del sistema)
UPDATE users
SET role = 'SUPER_ADMIN'
WHERE id = 1;

-- Si existe un segundo usuario, asignarle ADMIN
UPDATE users
SET role = 'ADMIN'
WHERE id = 2;
