-- Próximo servicio acordado por unidad (un solo compromiso por vehículo: km y/o fecha).
ALTER TABLE vehicles ADD COLUMN next_committed_service_mileage INTEGER NULL;
ALTER TABLE vehicles ADD COLUMN next_committed_service_date DATE NULL;
