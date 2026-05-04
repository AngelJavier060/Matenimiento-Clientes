export type TipoOperacion = 'C' | 'I' | 'A' | 'R' | 'IC';

export interface Actividad {
  id: number;
  nombre: string;
  tipo: TipoOperacion;
  intervaloKm: number;
  intervaloMeses: number;
}

export interface PlanMantenimiento {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  motor: string;
  tipoAceite: string;
  fuente: string;
  actividades: Actividad[];
}

export interface Vehiculo {
  id: number;
  placa: string;
  kmActuales: number;
  kmUltimoServicio: number;
  fechaUltimoServicio: Date;
  planMantenimientoId: number;
}

export type EstadoAlerta = 'vencido' | 'proximo' | 'ok';

export interface AlertaActividad {
  actividad: Actividad;
  estado: EstadoAlerta;
  kmDentroDelCiclo: number;
  kmParaSiguiente: number;
  porcentajeCiclo: number;
  numeroCiclo: number;
}
