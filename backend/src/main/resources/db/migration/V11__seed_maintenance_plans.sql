-- Seed data: planes de mantenimiento preventivo de ejemplo
-- Asociados al usuario admin existente (id = 1 si existe)
INSERT INTO maintenance_plans (marca, modelo, anio, motor, tipo_aceite, fuente, user_id, is_active)
VALUES
    ('CHEVROLET', 'Aveo Emotion', 2017, '1.6L SOHC', '5W-30', 'Catálogo', 1, TRUE),
    ('CHEVROLET', 'Sail', 2019, '1.4L', '5W-30', 'Catálogo', 1, TRUE),
    ('TOYOTA', 'Corolla', 2020, '2.0L', '0W-20', 'Catálogo', 1, TRUE),
    ('HYUNDAI', 'Elantra', 2021, '2.0L MPI', '5W-20', 'Catálogo', 1, TRUE),
    ('MAZDA', 'CX-5', 2022, '2.5L SkyActiv', '0W-20', 'Catálogo', 1, TRUE)
ON CONFLICT DO NOTHING;

-- Actividades para CHEVROLET Aveo (plan id 1 si existe)
INSERT INTO maintenance_plan_activities (plan_id, nombre, tipo, intervalo_km, intervalo_meses, is_active)
SELECT id, 'Cambio de aceite y filtro', 'C', 5000, 6, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion'
UNION ALL
SELECT id, 'Rotación de neumáticos', 'R', 10000, 6, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion'
UNION ALL
SELECT id, 'Filtro de aire motor', 'C', 15000, 12, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion'
UNION ALL
SELECT id, 'Revisión frenos delanteros', 'I', 20000, 12, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion'
UNION ALL
SELECT id, 'Cambio bujías', 'C', 30000, 24, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion'
UNION ALL
SELECT id, 'Cambio líquido frenos', 'C', 40000, 24, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion'
UNION ALL
SELECT id, 'Cambio correa distribución', 'C', 60000, 48, TRUE FROM maintenance_plans WHERE marca = 'CHEVROLET' AND modelo = 'Aveo Emotion';

-- Actividades para TOYOTA Corolla
INSERT INTO maintenance_plan_activities (plan_id, nombre, tipo, intervalo_km, intervalo_meses, is_active)
SELECT id, 'Cambio de aceite 0W-20', 'C', 5000, 6, TRUE FROM maintenance_plans WHERE marca = 'TOYOTA' AND modelo = 'Corolla'
UNION ALL
SELECT id, 'Rotación de neumáticos', 'R', 10000, 6, TRUE FROM maintenance_plans WHERE marca = 'TOYOTA' AND modelo = 'Corolla'
UNION ALL
SELECT id, 'Filtro aire cabina', 'C', 15000, 12, TRUE FROM maintenance_plans WHERE marca = 'TOYOTA' AND modelo = 'Corolla'
UNION ALL
SELECT id, 'Alineación y balanceo', 'A', 20000, 12, TRUE FROM maintenance_plans WHERE marca = 'TOYOTA' AND modelo = 'Corolla'
UNION ALL
SELECT id, 'Revisión sistema refrigeración', 'I', 40000, 24, TRUE FROM maintenance_plans WHERE marca = 'TOYOTA' AND modelo = 'Corolla';
