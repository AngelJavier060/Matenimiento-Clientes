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
  /** Presente en filas copiadas desde plantilla (for-vehicle). */
  clonedFromPlanActivityId?: number | null;
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
  /** Alta en libro por unidad enlazada a una fila MMY existente (opcional). */
  cloneFromPlanActivityId?: number | null;
}

/** Resolución vehículo → plan MP (`GET .../maintenance-plans/for-vehicle/{vehicleId}`) */
export interface VehicleMaintenancePlanMatchDto {
  vehicleId: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleMileage: number | null;
  licensePlate: string | null;
  /** FIXED | MMY | NONE */
  matchMode: string;
  resolvedPlanId: number | null;
  plan: PlanApiResponse | null;
  hint: string | null;
  lastServiceMileage: number | null;
  lastServiceDate: string | null;
  /** Acuerdo próximo mantenimiento (único por vehículo); editar en ficha del vehículo. */
  nextCommittedServiceMileage?: number | null;
  nextCommittedServiceDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MantenimientoService {

  private apiUrl = environment.apiUrl + '/maintenance-plans';
  private vehiclesApiUrl = environment.apiUrl + '/vehicles';

  constructor(private http: HttpClient) {}

  // ==================== API CALLS ====================

  /** Resolver plan mantenimiento preventivo cargado manualmente por MMY (o plan fijo en unidad) */
  obtenerMatchPlanPorVehiculo(vehicleId: number): Observable<VehicleMaintenancePlanMatchDto> {
    return this.http.get<VehicleMaintenancePlanMatchDto>(`${this.apiUrl}/for-vehicle/${vehicleId}`);
  }

  /** Alta de actividad preventiva sólo para la unidad (no toca la plantilla MMY). */
  agregarActividadVehiculoApi(vehicleId: number, request: ActivityApiRequest): Observable<ActivityApiResponse> {
    return this.http.post<ActivityApiResponse>(`${this.vehiclesApiUrl}/${vehicleId}/preventive-activities`, request);
  }

  actualizarActividadVehiculoApi(
    vehicleId: number,
    activityId: number,
    request: ActivityApiRequest
  ): Observable<ActivityApiResponse> {
    return this.http.put<ActivityApiResponse>(
      `${this.vehiclesApiUrl}/${vehicleId}/preventive-activities/${activityId}`,
      request
    );
  }

  eliminarActividadVehiculoApi(vehicleId: number, activityId: number): Observable<void> {
    return this.http.delete<void>(`${this.vehiclesApiUrl}/${vehicleId}/preventive-activities/${activityId}`);
  }

  /**
   * Copia a esta placa las actividades de la plantilla MMY que aún no existan (explícito; no modifica la plantilla).
   */
  incorporarActividadesPreventivasDesdePlantillaApi(vehicleId: number): Observable<void> {
    return this.http.post<void>(
      `${this.vehiclesApiUrl}/${vehicleId}/preventive-activities/incorporate-from-template`,
      {}
    );
  }

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
      intervaloMeses: api.intervaloMeses,
      clonedFromPlanActivityId: api.clonedFromPlanActivityId ?? null
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

  /**
   * Posición en el ciclo de km asumiendo hitos en múltiplos del intervalo desde odómetro 0
   * (5.000, 10.000, 15.000, … → “infinito” solo es repetir ese patrón; no hay que guardar todos).
   *
   * Ejemplo: kmActual = 200.061, intervaloKm = 5.000 → dentro del ciclo = 61, faltan 4.939 hasta 205.000.
   *
   * “Pasar de kilometraje” respecto a **un** hito conocido del plan (múltiplos desde 0):
   * después de 200.000, cualquier lectura mayor implica estar en zona de nuevo ciclo (retraso = kmActual − 200.000 hasta que registres la orden).
   * Para calcular por **último cambio de aceite real**, hace falta anclar a `útimo_servicio_km`; hoy `calcularAlerta` no usa `kmUltimoServicio` en la parte km.
   */
  resumenHitosKmDesdeKm0(
    kmActual: number,
    intervaloKm: number
  ): { kmEnCiclo: number; kmFaltanHastaProximo: number; proximoMultiploKm: number } {
    if (intervaloKm <= 0 || kmActual < 0) {
      return { kmEnCiclo: 0, kmFaltanHastaProximo: 0, proximoMultiploKm: kmActual };
    }
    const kmEnCiclo = kmActual % intervaloKm;
    const kmFaltanHastaProximo = kmEnCiclo === 0 ? intervaloKm : intervaloKm - kmEnCiclo;
    const proximoMultiploKm = kmActual + kmFaltanHastaProximo;
    return { kmEnCiclo, kmFaltanHastaProximo, proximoMultiploKm };
  }

  /** Próximos N múltiplos del intervalo **por encima** de la lectura actual (mismo criterio que `resumenHitosKmDesdeKm0`). */
  proximosNMultiplosKm(kmActual: number, intervaloKm: number, cantidad: number): number[] {
    if (intervaloKm <= 0 || cantidad <= 0) return [];
    let { proximoMultiploKm } = this.resumenHitosKmDesdeKm0(kmActual, intervaloKm);
    const hitos: number[] = [];
    for (let i = 0; i < cantidad; i++) {
      hitos.push(proximoMultiploKm);
      proximoMultiploKm += intervaloKm;
    }
    return hitos;
  }

  /**
   * Retraso por km respecto al ancla **último servicio**: `max(0, kmActual − (kmUltimo + intervalo))`.
   * Útil cuando el negocio no ancla los hitos en 0 sino en el último mantenimiento real.
   */
  kmRetrasoRespectoUltimoServicio(
    kmActual: number,
    kmUltimoServicio: number | null | undefined,
    intervaloKm: number
  ): number {
    if (intervaloKm <= 0 || kmUltimoServicio == null || kmUltimoServicio < 0) return 0;
    const vencimiento = kmUltimoServicio + intervaloKm;
    return Math.max(0, kmActual - vencimiento);
  }

  /**
   * Meses por encima del intervalo cronológico referidos al mismo último servicio del vehículo
   * (aprox.: diferencia en mes-calendario, sin día exacto).
   */
  mesesRetrasoRespectoUltimoServicio(
    fechaUltimoServicio: Date | null | undefined,
    fechaActual: Date,
    intervaloMeses: number
  ): number {
    if (!fechaUltimoServicio || intervaloMeses <= 0) return 0;
    const meses = this.calcularMeses(fechaUltimoServicio, fechaActual);
    return Math.max(0, meses - intervaloMeses);
  }

  /**
   * Estado de alerta mezcla km por módulo del odómetro (no usa `kmUltimoServicio` en ese tramo)
   * y tiempo por fecha del último servicio.
   */
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

  /**
   * Misma agrupación por intervalo km pero sin estado/km relativos al vehículo (lista de chequeo sólo lectura visual).
   */
  agruparActividadesSinAlertasKm(plan: PlanMantenimiento): Map<number, AlertaActividad[]> {
    const grupos = new Map<number, AlertaActividad[]>();
    (plan?.actividades ?? []).forEach((actividad) => {
      const km = actividad.intervaloKm;
      const neutral: AlertaActividad = {
        actividad,
        estado: 'ok',
        kmDentroDelCiclo: 0,
        kmParaSiguiente: 0,
        porcentajeCiclo: 0,
        numeroCiclo: 1
      };
      if (!grupos.has(km)) grupos.set(km, []);
      grupos.get(km)!.push(neutral);
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
