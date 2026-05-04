import { PlanMantenimiento } from '../models/mantenimiento.types';

export const PLANES_MANTENIMIENTO: PlanMantenimiento[] = [
  {
    id: 1,
    marca: 'Chevrolet',
    modelo: 'Aveo Emotion',
    anio: 2017,
    motor: '1.6L SOHC',
    tipoAceite: 'SAE 5W-30',
    fuente: 'Chevrolet Ecuador',
    actividades: [
      { id: 1,  nombre: 'Cambio de aceite de motor',             tipo: 'C',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 2,  nombre: 'Cambio de filtro de aceite',            tipo: 'C',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 3,  nombre: 'Inspección nivel de refrigerante',      tipo: 'I',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 4,  nombre: 'Inspección líquido de frenos',          tipo: 'I',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 5,  nombre: 'Inspección presión neumáticos',         tipo: 'I',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 6,  nombre: 'Cambio filtro aire A/C (habitáculo)',   tipo: 'C',  intervaloKm: 15000,  intervaloMeses: 12 },
      { id: 7,  nombre: 'Inspección filtro de aire motor',       tipo: 'I',  intervaloKm: 15000,  intervaloMeses: 12 },
      { id: 8,  nombre: 'Inspección bujías del motor',           tipo: 'I',  intervaloKm: 15000,  intervaloMeses: 12 },
      { id: 9,  nombre: 'Inspección pastillas de freno',         tipo: 'I',  intervaloKm: 15000,  intervaloMeses: 12 },
      { id: 10, nombre: 'Alineación y balanceo',                 tipo: 'R',  intervaloKm: 15000,  intervaloMeses: 12 },
      { id: 11, nombre: 'Cambio líquido de frenos',              tipo: 'C',  intervaloKm: 15000,  intervaloMeses: 12 },
      { id: 12, nombre: 'Inspección bandas alternador/A/C',      tipo: 'I',  intervaloKm: 30000,  intervaloMeses: 24 },
      { id: 13, nombre: 'Cambio correa de distribución',         tipo: 'C',  intervaloKm: 60000,  intervaloMeses: 48 },
      { id: 14, nombre: 'Cambio refrigerante motor',             tipo: 'C',  intervaloKm: 90000,  intervaloMeses: 72 },
      { id: 15, nombre: 'Cambio filtro de combustible',          tipo: 'C',  intervaloKm: 90000,  intervaloMeses: 72 },
      { id: 16, nombre: 'Cambio de bujías (NGK/ACDelco)',        tipo: 'C',  intervaloKm: 105000, intervaloMeses: 84 },
    ]
  },
  {
    id: 2,
    marca: 'Chevrolet',
    modelo: 'Sail',
    anio: 2019,
    motor: '1.5L DOHC',
    tipoAceite: 'SAE 5W-30',
    fuente: 'Chevrolet Ecuador',
    actividades: [
      { id: 1,  nombre: 'Cambio de aceite de motor',             tipo: 'C',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 2,  nombre: 'Cambio de filtro de aceite',            tipo: 'C',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 3,  nombre: 'Inspección nivel de refrigerante',      tipo: 'I',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 4,  nombre: 'Inspección líquido de frenos',          tipo: 'I',  intervaloKm: 5000,   intervaloMeses: 6  },
      { id: 5,  nombre: 'Cambio filtro aire A/C',                tipo: 'C',  intervaloKm: 10000,  intervaloMeses: 6  },
      { id: 6,  nombre: 'Inspección pastillas de freno',         tipo: 'I',  intervaloKm: 10000,  intervaloMeses: 6  },
      { id: 7,  nombre: 'Alineación y balanceo',                 tipo: 'R',  intervaloKm: 10000,  intervaloMeses: 6  },
      { id: 8,  nombre: 'Inspección bandas accesorios',          tipo: 'I',  intervaloKm: 20000,  intervaloMeses: 12 },
      { id: 9,  nombre: 'Cambio correa de distribución',         tipo: 'C',  intervaloKm: 60000,  intervaloMeses: 48 },
      { id: 10, nombre: 'Cambio refrigerante motor',             tipo: 'C',  intervaloKm: 80000,  intervaloMeses: 60 },
      { id: 11, nombre: 'Cambio de bujías',                      tipo: 'C',  intervaloKm: 80000,  intervaloMeses: 60 },
    ]
  },
  {
    id: 3,
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: 2020,
    motor: '1.8L VVT-i',
    tipoAceite: '0W-20 sintético',
    fuente: 'Toyota',
    actividades: [
      { id: 1,  nombre: 'Cambio de aceite de motor',             tipo: 'C',  intervaloKm: 10000,  intervaloMeses: 6  },
      { id: 2,  nombre: 'Cambio de filtro de aceite',            tipo: 'C',  intervaloKm: 10000,  intervaloMeses: 6  },
      { id: 3,  nombre: 'Inspección líquido de frenos',          tipo: 'I',  intervaloKm: 10000,  intervaloMeses: 6  },
      { id: 4,  nombre: 'Cambio filtro de cabina',               tipo: 'C',  intervaloKm: 20000,  intervaloMeses: 12 },
      { id: 5,  nombre: 'Inspección pastillas de freno',         tipo: 'I',  intervaloKm: 20000,  intervaloMeses: 12 },
      { id: 6,  nombre: 'Inspección bandas accesorios',          tipo: 'I',  intervaloKm: 40000,  intervaloMeses: 24 },
      { id: 7,  nombre: 'Cambio refrigerante motor',             tipo: 'C',  intervaloKm: 100000, intervaloMeses: 60 },
      { id: 8,  nombre: 'Cambio cadena distribución',            tipo: 'C',  intervaloKm: 120000, intervaloMeses: 96 },
      { id: 9,  nombre: 'Cambio bujías de iridio',               tipo: 'C',  intervaloKm: 120000, intervaloMeses: 96 },
    ]
  }
];
