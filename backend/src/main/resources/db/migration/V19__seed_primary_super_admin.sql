-- Superusuario + catálogo de planes (antes parte de V11; requiere user_id válido).

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

INSERT INTO maintenance_plans (marca, modelo, anio, motor, tipo_aceite, fuente, user_id, is_active)
SELECT v.marca, v.modelo, v.anio, v.motor, v.tipo_aceite, v.fuente, u.id, TRUE
FROM (VALUES
    ('CHEVROLET', 'Aveo Emotion', 2017, '1.6L SOHC', '5W-30', 'Catálogo'),
    ('CHEVROLET', 'Sail', 2019, '1.4L', '5W-30', 'Catálogo'),
    ('TOYOTA', 'Corolla', 2020, '2.0L', '0W-20', 'Catálogo'),
    ('HYUNDAI', 'Elantra', 2021, '2.0L MPI', '5W-20', 'Catálogo'),
    ('MAZDA', 'CX-5', 2022, '2.5L SkyActiv', '0W-20', 'Catálogo')
) AS v(marca, modelo, anio, motor, tipo_aceite, fuente),
LATERAL (SELECT id FROM users WHERE email = 'angeljaviermsn@gmail.com' LIMIT 1) u
WHERE NOT EXISTS (
    SELECT 1 FROM maintenance_plans p
    WHERE p.marca = v.marca AND p.modelo = v.modelo AND p.anio = v.anio
);

-- Actividades (idempotente por nombre + plan)
INSERT INTO maintenance_plan_activities (plan_id, nombre, tipo, intervalo_km, intervalo_meses, is_active)
SELECT mp.id, s.nombre, s.tipo, s.km, s.meses, TRUE
FROM maintenance_plans mp
CROSS JOIN (VALUES
    ('Cambio de aceite y filtro', 'C', 5000, 6),
    ('Rotación de neumáticos', 'R', 10000, 6),
    ('Filtro de aire motor', 'C', 15000, 12),
    ('Revisión frenos delanteros', 'I', 20000, 12),
    ('Cambio bujías', 'C', 30000, 24),
    ('Cambio líquido frenos', 'C', 40000, 24),
    ('Cambio correa distribución', 'C', 60000, 48)
) AS s(nombre, tipo, km, meses)
WHERE mp.marca = 'CHEVROLET' AND mp.modelo = 'Aveo Emotion'
  AND NOT EXISTS (
    SELECT 1 FROM maintenance_plan_activities x
    WHERE x.plan_id = mp.id AND x.nombre = s.nombre AND x.intervalo_km = s.km
  );

INSERT INTO maintenance_plan_activities (plan_id, nombre, tipo, intervalo_km, intervalo_meses, is_active)
SELECT mp.id, s.nombre, s.tipo, s.km, s.meses, TRUE
FROM maintenance_plans mp
CROSS JOIN (VALUES
    ('Cambio de aceite 0W-20', 'C', 5000, 6),
    ('Rotación de neumáticos', 'R', 10000, 6),
    ('Filtro aire cabina', 'C', 15000, 12),
    ('Alineación y balanceo', 'A', 20000, 12),
    ('Revisión sistema refrigeración', 'I', 40000, 24)
) AS s(nombre, tipo, km, meses)
WHERE mp.marca = 'TOYOTA' AND mp.modelo = 'Corolla'
  AND NOT EXISTS (
    SELECT 1 FROM maintenance_plan_activities x
    WHERE x.plan_id = mp.id AND x.nombre = s.nombre AND x.intervalo_km = s.km
  );
