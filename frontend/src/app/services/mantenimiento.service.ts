import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Actividad, AlertaActividad, EstadoAlerta,
  PlanMantenimiento, Vehiculo
} from '../models/mantenimiento.types';

export interface PlanApiResponse {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  motor: string;
  tipoAceite: string;
  fuente: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activities: ActivityApiResponse[];
  activityCount: number;
}

export interface ActivityApiResponse {
  id: number;
  nombre: string;
  tipo: string;
  intervaloKm: number;
  intervaloMeses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanApiRequest {
  marca: string;
  modelo: string;
  anio: number;
  motor?: string;
  tipoAceite?: string;
  fuente?: string;
  activities?: ActivityApiRequest[];
}

export interface ActivityApiRequest {
  nombre: string;
  tipo: string;
  intervaloKm: number;
  intervaloMeses: number;
}

@Injectable({ providedIn: 'root' })
export class MantenimientoService {

  private apiUrl = environment.apiUrl + '/maintenance-plans';

  constructor(private http: HttpClient) {}

  // ==================== API CALLS ====================

  /** Obtener todos los planes desde la API */
  obtenerTodosLosPlanesApi(): Observable<PlanApiResponse[]> {
    return this.http.get<PlanApiResponse[]>(`${this.apiUrl}`);
  }

  /** Obtener un plan por ID */
  obtenerPlanApi(id: number): Observable<PlanApiResponse> {
    return this.http.get<PlanApiResponse>(`${this.apiUrl}/${id}`);
  }

  /** Crear un nuevo plan */
  crearPlanApi(request: PlanApiRequest): Observable<PlanApiResponse> {
    return this.http.post<PlanApiResponse>(`${this.apiUrl}`, request);
  }

  /** Actualizar un plan */
  actualizarPlanApi(id: number, request: PlanApiRequest): Observable<PlanApiResponse> {
    return this.http.put<PlanApiResponse>(`${this.apiUrl}/${id}`, request);
  }

  /** Eliminar un plan (borrado lógico) */
  eliminarPlanApi(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Agregar actividad a un plan */
  agregarActividadApi(planId: number, request: ActivityApiRequest): Observable<ActivityApiResponse> {
    return this.http.post<ActivityApiResponse>(`${this.apiUrl}/${planId}/activities`, request);
  }

  /** Actualizar una actividad */
  actualizarActividadApi(planId: number, activityId: number, request: ActivityApiRequest): Observable<ActivityApiResponse> {
    return this.http.put<ActivityApiResponse>(`${this.apiUrl}/${planId}/activities/${activityId}`, request);
  }

  /** Eliminar una actividad */
  eliminarActividadApi(planId: number, activityId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${planId}/activities/${activityId}`);
  }

  // ==================== CONVERSIÓN API -> FRONTEND ====================

  /** Convertir respuesta API a PlanMantenimiento */
  apiToPlan(api: PlanApiResponse): PlanMantenimiento {
    return {
      id: api.id,
      marca: api.marca,
      modelo: api.modelo,
      anio: api.anio,
      motor: api.motor,
      tipoAceite: api.tipoAceite,
      fuente: api.fuente,
      actividades: (api.activities || []).map(a => this.apiToActividad(a))
    };
  }

  /** Convertir respuesta API a Actividad */
  apiToActividad(api: ActivityApiResponse): Actividad {
    return {
      id: api.id,
      nombre: api.nombre,
      tipo: api.tipo as Actividad['tipo'],
      intervaloKm: api.intervaloKm,
      intervaloMeses: api.intervaloMeses
    };
  }

  /** Convertir PlanMantenimiento a request API */
  planToRequest(plan: PlanMantenimiento): PlanApiRequest {
    return {
      marca: plan.marca,
      modelo: plan.modelo,
      anio: plan.anio,
      motor: plan.motor,
      tipoAceite: plan.tipoAceite,
      fuente: plan.fuente,
      activities: plan.actividades.map(a => ({
        nombre: a.nombre,
        tipo: a.tipo,
        intervaloKm: a.intervaloKm,
        intervaloMeses: a.intervaloMeses
      }))
    };
  }

  // ==================== LÓGICA DE ALERTAS (client-side) ====================

  calcularAlerta(
    kmActual: number, kmUltimoServicio: number,
    fechaActual: Date, fechaUltimoServicio: Date,
    actividad: Actividad
  ): AlertaActividad {

    const kmDentroDelCiclo = kmActual % actividad.intervaloKm;
    const numeroCiclo = Math.floor(kmActual / actividad.intervaloKm) + 1;
    const kmParaSiguiente = actividad.intervaloKm - kmDentroDelCiclo;
    const porcentajeCiclo = Math.min(100,
      Math.round((kmDentroDelCiclo / actividad.intervaloKm) * 100));

    const mesesTranscurridos = this.calcularMeses(fechaUltimoServicio, fechaActual);
    const mesesDentroDelCiclo = mesesTranscurridos % actividad.intervaloMeses;
    const mesesParaSiguiente = actividad.intervaloMeses - mesesDentroDelCiclo;

    const umbralVencidoKm  = actividad.intervaloKm * 0.05;
    const umbralProximoKm  = actividad.intervaloKm * 0.85;
    const umbralProximoMes = 1;

    const vencidoPorKm  = kmDentroDelCiclo < umbralVencidoKm && kmActual >= actividad.intervaloKm;
    const proximoPorKm  = !vencidoPorKm && porcentajeCiclo >= 85;
    const proximoPorMes = mesesParaSiguiente <= umbralProximoMes;

    let estado: EstadoAlerta;
    if (vencidoPorKm) {
      estado = 'vencido';
    } else if (proximoPorKm || proximoPorMes) {
      estado = 'proximo';
    } else {
      estado = 'ok';
    }

    return {
      actividad, estado,
      kmDentroDelCiclo, kmParaSiguiente,
      porcentajeCiclo, numeroCiclo
    };
  }

  obtenerAlertas(vehiculo: Vehiculo, plan: PlanMantenimiento, fechaActual: Date = new Date()): AlertaActividad[] {
    if (!plan) return [];
    return plan.actividades.map(actividad =>
      this.calcularAlerta(
        vehiculo.kmActuales,
        vehiculo.kmUltimoServicio,
        fechaActual,
        vehiculo.fechaUltimoServicio,
        actividad
      )
    );
  }

  obtenerAlertasAgrupadas(vehiculo: Vehiculo, plan: PlanMantenimiento): Map<number, AlertaActividad[]> {
    const alertas = this.obtenerAlertas(vehiculo, plan);
    const grupos = new Map<number, AlertaActividad[]>();
    alertas.forEach(alerta => {
      const km = alerta.actividad.intervaloKm;
      if (!grupos.has(km)) grupos.set(km, []);
      grupos.get(km)!.push(alerta);
    });
    return grupos;
  }

  estadoDelGrupo(alertas: AlertaActividad[]): EstadoAlerta {
    if (alertas.some(a => a.estado === 'vencido'))  return 'vencido';
    if (alertas.some(a => a.estado === 'proximo'))  return 'proximo';
    return 'ok';
  }

  contarVencidos(vehiculo: Vehiculo, plan: PlanMantenimiento): number {
    return this.obtenerAlertas(vehiculo, plan).filter(a => a.estado === 'vencido').length;
  }

  contarProximos(vehiculo: Vehiculo, plan: PlanMantenimiento): number {
    return this.obtenerAlertas(vehiculo, plan).filter(a => a.estado === 'proximo').length;
  }

  private calcularMeses(desde: Date, hasta: Date): number {
    const años  = hasta.getFullYear() - desde.getFullYear();
    const meses = hasta.getMonth()    - desde.getMonth();
    return Math.max(0, años * 12 + meses);
  }
}
