import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { MantenimientoService, ActivityApiResponse } from '../../services/mantenimiento.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { VehicleRequest } from '../../models/vehicle/vehicle-request';
import { AlertaActividad, Actividad, EstadoAlerta, PlanMantenimiento, Vehiculo } from '../../models/mantenimiento.types';

interface PlanItem {
  id: number;
  marca: string;
  modelo: string;
  anio: string;
}

@Component({
  selector: 'app-mp-plan',
  templateUrl: './mp-plan.component.html',
  styleUrls: ['./mp-plan.component.scss']
})
export class MpPlanComponent implements OnInit, OnChanges, OnDestroy {

  /** Vehículo de la vista (`/maintenance?vehicleId=…&categoria=preventivo`) */
  @Input() vehicleId: number | null = null;

  /** Avisá al padre para refrescar el resumen "plan ↔ placa" (BD) después de vincular. */
  @Output() planLinkageChanged = new EventEmitter<number>();

  loading = true;

  /** Copiloto servidor: cómo enlazamos plan ↔ auto */
  fleetMatchHint = '';
  fleetMatchMode: string | null = null;
  /** MMY del vehículo en flota (para mensajes cuando no hay emparejo). */
  fleetVehicleBrand = '';
  fleetVehicleModel = '';
  fleetVehicleYear: number | null = null;
  fleetResolvedPlanId: number | null = null;

  vinculandoPlanFijo = false;

  /** Resultado visible al usar «Incorporar novedades desde la plantilla». */
  incorporandoNovedades = false;
  incorporarFeedback: { tipo: 'ok' | 'info' | 'error'; texto: string } | null = null;
  private incorporarDismissTimer?: ReturnType<typeof setTimeout>;

  // Kilómetros del auto en flota (usado cuando hay vehicleId)
  vehiculoActivo: Vehiculo = {
    id: 0,
    placa: '—',
    kmActuales: 0,
    kmUltimoServicio: 0,
    fechaUltimoServicio: new Date(),
    planMantenimientoId: 0
  };

  // Plan activo seleccionado
  planActivo: PlanMantenimiento = {
    id: 0,
    marca: '—',
    modelo: 'Sin plan',
    anio: 0,
    motor: '',
    tipoAceite: '',
    fuente: '',
    actividades: []
  };

  // Lista de planes (marca/modelo/año)
  planList: PlanItem[] = [];

  // Formulario
  formMarca = '';
  formModelo = '';
  formAnio = '';
  editandoPlan = false;
  editandoPlanId: number | null = null;

  // Alertas calculadas
  alertasAgrupadas!: Map<number, AlertaActividad[]>;
  intervalosOrdenados: number[] = [];
  gruposAbiertos = new Set<number>();
  mostrarModal = false;

  // Formulario de nueva actividad (modal)
  formActividadNombre = '';
  formActividadTipo = 'C';
  formActividadKm = 5000;
  formActividadMeses = 6;
  editandoActividadId: number | null = null;

  /** GET plantilla MMY (ids catálogo) para listar sólo líneas pendientes en el libro de la placa. */
  cargandoCatalogoMmYParaLibro = false;
  catalogoMmYActivitiesRaw: ActivityApiResponse[] | null = null;

  tiposOperacion = [
    { valor: 'C', label: 'Cambiar' },
    { valor: 'I', label: 'Inspeccionar' },
    { valor: 'A', label: 'Ajustar' },
    { valor: 'R', label: 'Realizar' },
    { valor: 'IC', label: 'Insp. y cambiar' }
  ];

  opcionesKm = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 90000, 105000, 120000];
  opcionesMeses = [3, 6, 12, 18, 24, 36, 48, 60, 72, 84];

  constructor(
    private mpService: MantenimientoService,
    private vehicleService: VehicleService,
    private router: Router
  ) {
    this.alertasAgrupadas = new Map();
  }

  ngOnInit(): void {
    this.cargarPlanesDesdeApi();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicleId']) {
      this.cerrarIncorporarMensaje();
      this.aplicarVehiculoDeFlota();
    }
  }

  ngOnDestroy(): void {
    this.limpiarTimerIncorporar();
  }

  private cargarPlanesDesdeApi(): void {
    this.loading = true;
    this.mpService.obtenerTodosLosPlanesApi().subscribe({
      next: (planes) => {
        this.planList = planes.map(p => ({
          id: p.id,
          marca: p.marca,
          modelo: p.modelo,
          anio: `${p.anio} ${p.motor}`
        }));
        if (this.planList.length > 0 && !this.vehicleId) {
          this.seleccionarPlan(this.planList[0]);
        }
        if (this.vehicleId) {
          this.aplicarVehiculoDeFlota();
          return;
        }
        this.loading = false;
        this.planLinkageChanged.emit(0);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Pide al servidor incorporar clones faltantes desde la plantilla MMY y luego refresca el libro de esta placa.
   * (Abrir la pantalla ya no ejecuta ese copiado solo; debe usarse este botón o alta manual «Actividad».)
   */
  incorporarNovedadesDesdePlantillaGeneral(): void {
    if (!this.contextoLibroPorPlacaServidor || this.vehicleId == null) {
      return;
    }
    const prevCount = this.planActivo.actividades?.length ?? 0;
    this.cerrarIncorporarMensaje();
    this.incorporandoNovedades = true;
        this.mpService.incorporarActividadesPreventivasDesdePlantillaApi(this.vehicleId).subscribe({
          next: () => {
            this.aplicarVehiculoDeFlota({ prevActivitiesBeforeIncorp: prevCount });
          },
      error: () => {
        this.incorporandoNovedades = false;
        this.incorporarFeedback = {
          tipo: 'error',
          texto:
            'No se pudo incorporar desde la plantilla. Comprobá la conexión o que tengas el vehículo vinculado a un plan MMY.'
        };
        this.programarAutoCierreIncorporacion();
      }
    });
  }

  cerrarIncorporarMensaje(): void {
    this.limpiarTimerIncorporar();
    this.incorporarFeedback = null;
  }

  private limpiarTimerIncorporar(): void {
    if (this.incorporarDismissTimer != null) {
      clearTimeout(this.incorporarDismissTimer);
      this.incorporarDismissTimer = undefined;
    }
  }

  /** Resuelve plan + métricas del vehículo elegido en la página de mantenimientos preventivos. */
  private aplicarVehiculoDeFlota(opcionesIncorp?: { prevActivitiesBeforeIncorp: number }): void {
    const modoIncorp = opcionesIncorp != null;
    const vid = this.vehicleId;
    if (vid == null) {
      this.fleetMatchHint = 'Seleccioná un vehículo arriba o entrá con ?vehicleId= en la barra.';
      this.fleetMatchMode = null;
      this.fleetVehicleBrand = '';
      this.fleetVehicleModel = '';
      this.fleetVehicleYear = null;
      this.fleetResolvedPlanId = null;
      this.catalogoMmYActivitiesRaw = null;
      this.cargandoCatalogoMmYParaLibro = false;
      if (!this.editandoPlan) {
        this.formMarca = '';
        this.formModelo = '';
        this.formAnio = '';
      }
      if (this.planList.length > 0 && !this.planActivo.id) {
        this.seleccionarPlan(this.planList[0]);
      }
      return;
    }

    // Evita usar emparejo de otra unidad mientras llega GET for-vehicle (un clic mal ⇒ DELETE plantilla MMY).
    this.fleetMatchMode = null;
    this.fleetResolvedPlanId = null;
    this.fleetVehicleBrand = '';
    this.fleetVehicleModel = '';
    this.fleetVehicleYear = null;
    this.catalogoMmYActivitiesRaw = null;
    this.cargandoCatalogoMmYParaLibro = false;

    if (modoIncorp) {
      this.incorporandoNovedades = true;
    } else {
      this.loading = true;
    }

    this.mpService.obtenerMatchPlanPorVehiculo(vid).subscribe({
      next: (m) => {
        this.fleetMatchHint = m.hint ?? '';
        this.fleetMatchMode = m.matchMode ?? null;
        this.fleetVehicleBrand = m.vehicleBrand ?? '';
        this.fleetVehicleModel = m.vehicleModel ?? '';
        this.fleetVehicleYear = m.vehicleYear ?? null;
        this.fleetResolvedPlanId = m.resolvedPlanId ?? null;

        const kmActual = m.vehicleMileage ?? 0;
        const ultSrvKm = m.lastServiceMileage != null ? m.lastServiceMileage : kmActual;
        let fechaUlt = new Date();
        if (m.lastServiceDate) {
          fechaUlt = new Date(m.lastServiceDate + 'T12:00:00');
        }

        this.vehiculoActivo = {
          id: vid,
          placa: m.licensePlate ?? 'Sin placa',
          kmActuales: kmActual,
          kmUltimoServicio: ultSrvKm,
          fechaUltimoServicio: fechaUlt,
          planMantenimientoId: m.resolvedPlanId ?? 0
        };

        if (m.plan) {
          this.planActivo = this.mpService.apiToPlan({
            ...m.plan,
            activities: m.plan.activities ?? []
          });
        } else {
          this.planActivo = this.crearPlanVacio();
        }

        if (!this.editandoPlan) {
          this.formMarca = '';
          this.formModelo = '';
          this.formAnio = '';
        }

        this.cargarAlertas();

        this.refrescarCatalogoMmYPosteriorEmparejo(m);

        if (modoIncorp && opcionesIncorp) {
          this.incorporandoNovedades = false;
          const nextCount = this.planActivo.actividades?.length ?? 0;
          this.asignarFeedbackIncorporacion(opcionesIncorp.prevActivitiesBeforeIncorp, nextCount);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.fleetMatchHint = 'No se pudo obtener el plan del vehículo. Verificá conexión.';
        this.fleetMatchMode = null;
        this.fleetVehicleBrand = '';
        this.fleetVehicleModel = '';
        this.fleetVehicleYear = null;
        this.fleetResolvedPlanId = null;
        this.catalogoMmYActivitiesRaw = null;
        this.cargandoCatalogoMmYParaLibro = false;
        if (modoIncorp) {
          this.incorporandoNovedades = false;
          this.incorporarFeedback = {
            tipo: 'error',
            texto: 'No se pudo comunicar con el servidor. No se aplicó ningún cambio — probá otra vez con conexión estable.'
          };
          this.programarAutoCierreIncorporacion();
        } else {
          this.loading = false;
        }
      }
    });
  }

  /** Catálogo MMY local (IDs de plantilla) para saber qué líneas pueden sumarse aún al libro por placa; avisa al panel de flotas para refrescar cachés. */
  private refrescarCatalogoMmYPosteriorEmparejo(m: {
    resolvedPlanId: number | null;
    matchMode?: string | null;
  }): void {
    const vid = this.vehicleId ?? 0;
    const notifyFleetPanelTemplatesChanged = (): void => {
      this.planLinkageChanged.emit(vid);
    };
    const pid = m.resolvedPlanId;
    const mode = ((m.matchMode ?? '') || '').toUpperCase();
    if (pid == null || mode === 'NONE') {
      this.catalogoMmYActivitiesRaw = null;
      this.cargandoCatalogoMmYParaLibro = false;
      notifyFleetPanelTemplatesChanged();
      return;
    }
    this.cargandoCatalogoMmYParaLibro = true;
    this.catalogoMmYActivitiesRaw = null;
    this.mpService.obtenerPlanApi(pid).subscribe({
      next: (cat) => {
        this.catalogoMmYActivitiesRaw = (cat.activities ?? []).filter((a) => a.isActive !== false);
        this.cargandoCatalogoMmYParaLibro = false;
        notifyFleetPanelTemplatesChanged();
      },
      error: () => {
        this.catalogoMmYActivitiesRaw = [];
        this.cargandoCatalogoMmYParaLibro = false;
        notifyFleetPanelTemplatesChanged();
      }
    });
  }

  private asignarFeedbackIncorporacion(prev: number, next: number): void {
    let tipo: 'ok' | 'info' = 'info';
    let texto: string;
    if (next > prev) {
      const delta = next - prev;
      tipo = 'ok';
      texto =
        `Listo — el servidor ya guardó la actualización en esta placa. Se incorporaron ${delta} actividad${delta !== 1 ? 'es' : ''} nueva${delta !== 1 ? 's' : ''} desde la plantilla general (podés verlas en la tabla de la derecha).`;
    } else if (next === prev && prev > 0) {
      texto =
        `Sincronización correcta: tus datos están en el servidor. No había actividades nuevas en la plantilla que faltaran aquí (${prev} línea${prev !== 1 ? 's' : ''}).`;
    } else if (next === prev && prev === 0) {
      texto =
        `Consulta bien recibida, pero el libro de esta placa sigue sin líneas cargadas desde el plan. Verificá vincular plantilla o el plan aplicado en el servidor.`;
    } else {
      texto = `Libro actualizado desde servidor: ahora muestra ${next} línea${next !== 1 ? 's' : ''}.`;
    }
    this.incorporarFeedback = { tipo, texto };
    this.programarAutoCierreIncorporacion();
  }

  private programarAutoCierreIncorporacion(): void {
    this.limpiarTimerIncorporar();
    this.incorporarDismissTimer = window.setTimeout(() => {
      this.incorporarDismissTimer = undefined;
      this.incorporarFeedback = null;
    }, 14000);
  }

  // CRUD DE PLANES (Marca / Modelo / Año-Versión)
  // ----------------------------------------------------------

  guardarPlan(): void {
    const marca = this.formMarca.trim();
    const modelo = this.formModelo.trim();
    const anioStr = this.formAnio.trim();

    if (
      this.vehicleId != null &&
      this.fleetMatchMode != null &&
      this.fleetMatchMode !== 'NONE' &&
      this.fleetResolvedPlanId != null &&
      !(this.editandoPlan === true && this.editandoPlanId === this.fleetResolvedPlanId)
    ) {
      alert(
        'Con una placa que ya tiene plan emparejado no podés dar de alta otra MMY desde aquí. Editá sólo la plantilla destacada del catálogo o liberá/desarrollá ese caso desde “Vincular plan”.'
      );
      return;
    }

    if (!marca || !modelo || !anioStr) {
      alert('Completá marca, modelo y año/versión para guardar el plan.');
      return;
    }

    const partes = anioStr.split(/\s+/).filter(Boolean);
    const añoToken = partes[0] ?? '';
    const anioNum = parseInt(añoToken, 10);
    if (Number.isNaN(anioNum) || anioNum < 1900 || anioNum > 2035) {
      alert(
        'El año debe ser un número entre 1900 y 2035. Poné solo el año al inicio, por ejemplo "2017" o "2017 1.6". Un valor tipo "20217" no emparejará con el año del vehículo.'
      );
      return;
    }
    if (añoToken.replace(/\D/g, '').length > 4 && /^\d/.test(anioStr)) {
      alert('Revisá el año: parece tener demasiados dígitos. Usá formato "2017" o "2017 motor 1.6".');
      return;
    }

    const version = partes.slice(1).join(' ').trim();

    const planRequest = {
      marca,
      modelo,
      anio: anioNum,
      motor: version || añoToken,
      tipoAceite: '',
      fuente: 'Usuario'
    };

    const onErr = (err: unknown) => {
      const e = err as { error?: { message?: string }; message?: string };
      const msg = e?.error?.message || e?.message || 'Error al guardar el plan. ¿Backend en marcha y sesión válida?';
      alert(msg);
    };

    if (this.editandoPlan && this.editandoPlanId !== null) {
      this.mpService.actualizarPlanApi(this.editandoPlanId, planRequest).subscribe({
        next: () => {
          this.cargarPlanesDesdeApi();
          this.despuésDeGuardarPlantillaMmY();
        },
        error: onErr
      });
    } else {
      this.mpService.crearPlanApi(planRequest).subscribe({
        next: (nuevo) => {
          this.cargarPlanesDesdeApi();
          if (
            this.vehicleId != null &&
            (this.fleetMatchMode === 'FIXED' || this.fleetMatchMode === 'MMY')
          ) {
            this.despuésDeGuardarPlantillaMmY();
            this.aplicarVehiculoDeFlota();
            return;
          }
          if (this.vehicleId == null || this.fleetMatchMode === 'NONE') {
            this.seleccionarPlan({
              id: nuevo.id,
              marca: nuevo.marca,
              modelo: nuevo.modelo,
              anio: `${nuevo.anio} ${nuevo.motor}`
            });
          }
          this.despuésDeGuardarPlantillaMmY();
        },
        error: onErr
      });
    }
  }

  editarPlan(item: PlanItem): void {
    if (!this.puedeOperarListaPlanMmY(item)) {
      alert(
        'Este plan del catálogo no corresponde a la unidad seleccionada. Editá ese MMY sin placa cargada o libera el vínculo primero.'
      );
      return;
    }
    this.formMarca = item.marca;
    this.formModelo = item.modelo;
    this.formAnio = item.anio;
    this.editandoPlan = true;
    this.editandoPlanId = item.id;
  }

  clickFilaListaCatalogo(item: PlanItem): void {
    if (this.loading) {
      return;
    }
    if (!this.puedeOperarListaPlanMmY(item)) {
      alert(
        'Este vehículo ya tiene plan emparejado con el servidor. No podés abrir la plantilla de otra marca o modelo desde esta vista; usarlo desincronizaría el preventivo.'
      );
      return;
    }
    this.seleccionarPlan(item);
  }

  eliminarPlan(id: number): void {
    const item = this.planList.find((p) => p.id === id);
    if (item != null && !this.puedeOperarListaPlanMmY(item)) {
      alert(
        'No podés borrar ese plan del catálogo mientras trabajás con una placa emparejada a otro MMY.'
      );
      return;
    }
    this.mpService.eliminarPlanApi(id).subscribe({
      next: () => {
        this.cargarPlanesDesdeApi();
        if (this.planActivo?.id === id) {
          this.planActivo = this.crearPlanVacio();
          this.alertasAgrupadas = new Map();
          this.intervalosOrdenados = [];
        }
      }
    });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  /**
   * Cuando hay placa con plan MMY/FIXED en servidor, no aplicar datos del GET `/maintenance-plans/{id}` para ese mismo id:
   * trae IDs de {@code MaintenancePlanActivity} y reemplazan el libro por unidad ({@code VehiclePreventiveActivity}).
   */
  private debeEvitarPlantillaSobreLibroPorPlaca(planCatalogoId: number): boolean {
    return (
      this.vehicleId != null &&
      this.fleetMatchMode != null &&
      this.fleetMatchMode !== 'NONE' &&
      this.fleetResolvedPlanId != null &&
      planCatalogoId === this.fleetResolvedPlanId
    );
  }

  seleccionarPlan(item: PlanItem): void {
    if (this.vehicleId != null && this.loading) {
      return;
    }
    if (
      this.vehicleId != null &&
      this.fleetMatchMode != null &&
      this.fleetMatchMode !== 'NONE' &&
      this.fleetResolvedPlanId === item.id
    ) {
      this.aplicarVehiculoDeFlota();
      return;
    }
    this.loading = true;
    this.mpService.obtenerPlanApi(item.id).subscribe({
      next: (apiPlan) => {
        if (this.debeEvitarPlantillaSobreLibroPorPlaca(item.id)) {
          this.loading = false;
          this.aplicarVehiculoDeFlota();
          return;
        }
        this.planActivo = this.mpService.apiToPlan(apiPlan);
        this.vehiculoActivo.planMantenimientoId = item.id;
        this.cargarAlertas();
        this.loading = false;
      },
      error: () => {
        this.planActivo = {
          id: item.id,
          marca: item.marca,
          modelo: item.modelo,
          anio: parseInt(item.anio) || 0,
          motor: item.anio.replace(/[0-9]/g, '').trim() || 'N/A',
          tipoAceite: '—',
          fuente: 'Usuario',
          actividades: []
        };
        this.loading = false;
      }
    });
  }

  private limpiarFormulario(): void {
    this.formMarca = '';
    this.formModelo = '';
    this.formAnio = '';
    this.editandoPlan = false;
    this.editandoPlanId = null;
  }

  /** Rellena marca / modelo / año de la unidad en flota (registro de plantilla MMY). */
  rellenarFormMmYdesdeLaUnidad(mostrarAyudaSiVacío = false): void {
    if (this.vehicleId == null) {
      if (mostrarAyudaSiVacío) {
        alert('Elegí antes un vehículo en el selector superior.');
      }
      return;
    }
    const b = (this.fleetVehicleBrand ?? '').trim();
    const mo = (this.fleetVehicleModel ?? '').trim();
    const y = this.fleetVehicleYear != null ? String(this.fleetVehicleYear) : '';
    if (mostrarAyudaSiVacío && !b && !mo && !y) {
      alert('El servidor aún no devolvió MMY del vehículo. Esperá que termine de cargar.');
      return;
    }
    this.formMarca = b;
    this.formModelo = mo;
    this.formAnio = y;
  }

  private despuésDeGuardarPlantillaMmY(): void {
    this.limpiarFormulario();
  }

  /** Plan resuelto NONE pero el usuario abrió una plantilla del catálogo: se puede fijar en BD. */
  get showAssociatePlanButton(): boolean {
    return (
      this.vehicleId != null &&
      this.planActivo.id > 0 &&
      this.fleetMatchMode === 'NONE'
    );
  }

  registrarServicioPreventivo(): void {
    if (this.vehicleId == null) {
      alert('Elegí una unidad por placa en el selector superior.');
      return;
    }
    void this.router.navigate(['/maintenance/new'], {
      queryParams: { vehicleId: this.vehicleId, categoria: 'preventivo' }
    });
  }

  /** Persiste maintenance_plan_id en el vehículo (misma API que Editar vehículo). */
  asociarPlantillaEstaPlaca(): void {
    const vid = this.vehicleId;
    const pid = this.planActivo?.id;
    if (vid == null || !pid || pid <= 0) {
      alert('Seleccioná una plantilla del catálogo y una unidad arriba.');
      return;
    }
    if (this.fleetMatchMode !== 'NONE') {
      return;
    }

    this.vinculandoPlanFijo = true;
    this.vehicleService.getVehicleById(vid).subscribe({
      next: (v) => {
        const req: VehicleRequest = {
          brand: v.brand,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate,
          vin: v.vin,
          mileage: v.mileage,
          fuelType: v.fuelType as VehicleRequest['fuelType'],
          transmission: v.transmission as VehicleRequest['transmission'],
          color: v.color,
          notes: v.notes,
          clientId: v.clientId,
          maintenancePlanId: pid
        };
        this.vehicleService.updateVehicle(vid, req).subscribe({
          next: () => {
            this.vinculandoPlanFijo = false;
            this.aplicarVehiculoDeFlota();
          },
          error: (err: unknown) => {
            this.vinculandoPlanFijo = false;
            const e = err as { error?: { message?: string } };
            alert(e?.error?.message || 'No se pudo guardar la vinculación con la placa.');
          }
        });
      },
      error: () => {
        this.vinculandoPlanFijo = false;
        alert('No se pudieron leer los datos del vehículo.');
      }
    });
  }

  private crearPlanVacio(): PlanMantenimiento {
    return {
      id: 0,
      marca: '—',
      modelo: 'Sin plan',
      anio: 0,
      motor: '',
      tipoAceite: '',
      fuente: '',
      actividades: []
    };
  }

  /**
   * El servidor tiene plan MMY o fijo resuelto para esta placa: altas/bajas de líneas deben usar la API por vehículo
   * ({@code /vehicles/.../preventive-activities}), no la plantilla MMY global.
   */
  get contextoLibroPorPlacaServidor(): boolean {
    return (
      this.vehicleId != null &&
      this.fleetMatchMode != null &&
      this.fleetMatchMode !== 'NONE' &&
      this.fleetResolvedPlanId != null
    );
  }

  /**
   * CRUD líneas usando API por vehículo (si es false y hay placa pero aún se resolvió NONE, usa plantilla).
   * No confundir con {@link #loading}: mientras {@code loading} debe bloquearse el CRUD.
   */
  get crudLineasUsaApiLibroPorPlaca(): boolean {
    return this.contextoLibroPorPlacaServidor && !this.loading && !this.incorporandoNovedades;
  }

  private strictTplIdLike(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v));
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null;
    return n;
  }

  private nombreNormFleet(s: unknown): string {
    return String(s ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  private mismoKmMesFleet(act: Pick<Actividad, 'intervaloKm' | 'intervaloMeses'>, tpl: ActivityApiResponse): boolean {
    const kk = Number(act.intervaloKm ?? NaN);
    const kt = Number(tpl.intervaloKm ?? NaN);
    const mk = Number(act.intervaloMeses ?? NaN);
    const mt = Number(tpl.intervaloMeses ?? NaN);
    return (
      (Number.isFinite(kk) ? Math.trunc(kk) : 0) === (Number.isFinite(kt) ? Math.trunc(kt) : 0) &&
      (Number.isFinite(mk) ? Math.trunc(mk) : 0) === (Number.isFinite(mt) ? Math.trunc(mt) : 0)
    );
  }

  /** Ya está incorporada/clon-equivalente al catálogo (misma regla que el panel de placas flota). */
  private actividadLibroCubreFilaTpl(act: Actividad, tpl: ActivityApiResponse): boolean {
    const cid = this.strictTplIdLike(act.clonedFromPlanActivityId);
    const tid = this.strictTplIdLike(tpl.id);
    if (cid != null && tid != null && cid === tid) return true;
    const nLibro = this.nombreNormFleet(act.nombre);
    const nTpl = this.nombreNormFleet(tpl.nombre);
    if (!nLibro || !nTpl || nLibro !== nTpl) return false;
    return this.mismoKmMesFleet(act, tpl);
  }

  /** Líneas MMY vigentes en catálogo que esta placa aún no tiene vinculadas (clonedFromPlanActivityId). */
  get actividadesPendientesPlantillaParaLibro(): ActivityApiResponse[] {
    const raw = this.catalogoMmYActivitiesRaw;
    if (!raw?.length) {
      return [];
    }
    const libro = this.planActivo?.actividades ?? [];
    return raw.filter((tpl) => libro.every((act) => !this.actividadLibroCubreFilaTpl(act, tpl)));
  }

  /** Encabezado botón nuevo ítem libro vs plantilla. */
  get textoBotonNuevaActividadHeader(): string {
    return this.contextoLibroPorPlacaServidor ? 'Agregar' : 'Actividad';
  }

  get intervalosReferenciaCatalogo(): number[] {
    const grupos = this.mpService.agruparActividadesSinAlertasKm(this.planActivo);
    return Array.from(grupos.keys()).sort((a, b) => a - b);
  }

  /** Semáforo km/fecha sólo donde la unidad y el MMY cargado son coherentes (o libro por placa sincronizado). */
  get mostrarAlertasKmPorUnidadSeleccionada(): boolean {
    return this.usaAlertasConOdometroUnidad();
  }

  private usaAlertasConOdometroUnidad(): boolean {
    if (this.vehicleId == null) {
      return false;
    }
    if (this.contextoLibroPorPlacaServidor) {
      return true;
    }
    if (!this.fleetMatchMode || this.fleetMatchMode === 'NONE') {
      return this.planMmYAlineadoConVehiculoEnSelector();
    }
    return false;
  }

  private planMmYAlineadoConVehiculoEnSelector(): boolean {
    const yv = this.fleetVehicleYear;
    if (
      yv == null ||
      !this.planActivo?.marca ||
      Number.isNaN(Number(this.planActivo.anio))
    ) {
      return false;
    }
    return (
      this.normMmYToken(this.planActivo.marca) === this.normMmYToken(this.fleetVehicleBrand) &&
      this.normMmYToken(this.planActivo.modelo) === this.normMmYToken(this.fleetVehicleModel) &&
      Number(this.planActivo.anio) === Number(yv)
    );
  }

  private normMmYToken(s: string | null | undefined): string {
    return (s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /** Con placa y plan ya emparejado (servidor): no se permite abrir/editar otros MMY del catálogo. */
  puedeOperarListaPlanMmY(item: PlanItem): boolean {
    if (
      this.vehicleId != null &&
      this.fleetMatchMode &&
      this.fleetMatchMode !== 'NONE' &&
      this.fleetResolvedPlanId != null
    ) {
      return item.id === this.fleetResolvedPlanId;
    }
    return true;
  }

  get permiteAgregarActividad(): boolean {
    if (this.planActivo.id <= 0) {
      return false;
    }
    if (!this.vehicleId) {
      return true;
    }
    if (this.loading || this.incorporandoNovedades) {
      return false;
    }
    if (this.fleetMatchMode == null) {
      return false;
    }
    if (this.fleetMatchMode === 'NONE') {
      return true;
    }
    return this.contextoLibroPorPlacaServidor;
  }

  // ----------------------------------------------------------
  // CARGAR / CALCULAR ALERTAS
  // ----------------------------------------------------------

  private cargarAlertas(): void {
    if (!this.planActivo) {
      this.alertasAgrupadas = new Map();
      this.intervalosOrdenados = [];
      return;
    }
    if (!this.usaAlertasConOdometroUnidad()) {
      this.alertasAgrupadas = this.mpService.agruparActividadesSinAlertasKm(this.planActivo);
    } else {
      this.alertasAgrupadas = this.mpService.obtenerAlertasAgrupadas(this.vehiculoActivo, this.planActivo);
    }
    this.intervalosOrdenados = Array.from(this.alertasAgrupadas.keys()).sort((a, b) => a - b);

    this.gruposAbiertos.clear();
    this.intervalosOrdenados.forEach((km) => {
      if (!this.usaAlertasConOdometroUnidad()) {
        this.gruposAbiertos.add(km);
        return;
      }
      const alertas = this.alertasAgrupadas.get(km)!;
      const estado = this.mpService.estadoDelGrupo(alertas);
      if (estado === 'vencido' || estado === 'proximo') {
        this.gruposAbiertos.add(km);
      }
    });
  }

  actualizarKm(km: number): void {
    this.vehiculoActivo.kmActuales = km;
    this.cargarAlertas();
  }

  get modalTituloActividad(): string {
    if (this.editandoActividadId != null) {
      return 'Editar actividad';
    }
    return this.contextoLibroPorPlacaServidor
      ? `Agregar — ${this.vehiculoActivo.placa || 'esta placa'}`
      : 'Nueva actividad';
  }

  puedeGestionarActividadBd(act: Actividad): boolean {
    if (this.planActivo.id <= 0 || act.id <= 0) return false;
    return this.permiteAgregarActividad;
  }

  /** Incorpora una línea puntual desde el catálogo MMY (vínculo en servidor vía cloneFromPlanActivityId). */
  agregarLineaCatalogoMmYAlLibro(row: ActivityApiResponse): void {
    if (!this.crudLineasUsaApiLibroPorPlaca || this.vehicleId == null) {
      return;
    }
    this.mpService
      .agregarActividadVehiculoApi(this.vehicleId, {
        nombre: row.nombre,
        tipo: row.tipo,
        intervaloKm: row.intervaloKm,
        intervaloMeses: row.intervaloMeses,
        cloneFromPlanActivityId: row.id
      })
      .subscribe({
        next: () => {
          this.recargarPlanActivoCatalogo();
        },
        error: (err: unknown) => {
          const e = err as { error?: { message?: string } };
          alert(e?.error?.message || 'No se pudo agregar la línea al libro de esta placa.');
        }
      });
  }

  abrirModalNuevaActividad(): void {
    if (!this.permiteAgregarActividad) {
      return;
    }
    this.editandoActividadId = null;
    this.formActividadNombre = '';
    this.formActividadTipo = 'C';
    this.formActividadKm = 5000;
    this.formActividadMeses = 6;
    this.mostrarModal = true;
  }

  abrirModalEditarActividad(alerta: AlertaActividad, evt: Event): void {
    evt.stopPropagation();
    const act = alerta.actividad;
    if (!this.puedeGestionarActividadBd(act)) {
      return;
    }
    this.editandoActividadId = act.id;
    this.formActividadNombre = act.nombre;
    this.formActividadTipo = act.tipo;
    this.formActividadKm = act.intervaloKm;
    this.formActividadMeses = act.intervaloMeses;
    this.mostrarModal = true;
  }

  cerrarModalActividad(): void {
    this.mostrarModal = false;
    this.editandoActividadId = null;
    this.formActividadNombre = '';
    this.formActividadTipo = 'C';
    this.formActividadKm = 5000;
    this.formActividadMeses = 6;
  }

  private recargarPlanActivoCatalogo(): void {
    if (this.contextoLibroPorPlacaServidor && this.vehicleId != null) {
      this.aplicarVehiculoDeFlota();
      return;
    }
    const item = this.planList.find((p) => p.id === this.planActivo.id);
    if (item) {
      this.seleccionarPlan(item);
      return;
    }
    if (this.vehicleId != null) {
      this.aplicarVehiculoDeFlota();
    }
  }

  eliminarActividadDePlan(alerta: AlertaActividad, evt: Event): void {
    evt.stopPropagation();
    const act = alerta.actividad;
    if (!this.puedeGestionarActividadBd(act)) {
      return;
    }
    if (
      this.vehicleId != null &&
      (this.loading || this.incorporandoNovedades || this.fleetMatchMode == null)
    ) {
      alert('Esperá a que termine de cargar el emparejo del plan con esta unidad y volvé a intentar.');
      return;
    }

    const quitaSoloPlaca = this.vehicleId != null && this.crudLineasUsaApiLibroPorPlaca;
    const msg = quitaSoloPlaca
      ? `¿Quitar "${act.nombre}" sólo de esta unidad? La plantilla general MMY no se modifica.`
      : `¿Eliminar "${act.nombre}" de la plantilla general MMY del catálogo?`;
    if (!confirm(msg)) {
      return;
    }
    const sub = quitaSoloPlaca
      ? this.mpService.eliminarActividadVehiculoApi(this.vehicleId!, act.id)
      : this.mpService.eliminarActividadApi(this.planActivo.id, act.id);
    sub.subscribe({
      next: () => {
        this.recargarPlanActivoCatalogo();
      },
      error: (err: unknown) => {
        const e = err as { error?: { message?: string } };
        alert(e?.error?.message || 'No se pudo eliminar la actividad.');
      }
    });
  }

  guardarActividad(): void {
    if (!this.permiteAgregarActividad) {
      alert('Con esta placa solo podés añadir o editar líneas en el libro de la misma marca/plan ya emparejado, o cargá otro caso sin vínculo (NONE) desde el catálogo.');
      return;
    }
    if (!this.formActividadNombre.trim() || !this.planActivo?.id) return;
    const usApiUnidad = this.crudLineasUsaApiLibroPorPlaca;

    const request = {
      nombre: this.formActividadNombre.trim(),
      tipo: this.formActividadTipo,
      intervaloKm: Number(this.formActividadKm),
      intervaloMeses: Number(this.formActividadMeses)
    };

    const onErr = (err: unknown) => {
      const e = err as { error?: { message?: string } };
      alert(e?.error?.message || 'Error al guardar la actividad.');
    };

    const onOk = (): void => {
      this.cerrarModalActividad();
      this.recargarPlanActivoCatalogo();
      this.planLinkageChanged.emit(this.vehicleId ?? 0);
    };

    if (this.editandoActividadId != null) {
      if (usApiUnidad) {
        this.mpService
          .actualizarActividadVehiculoApi(this.vehicleId!, this.editandoActividadId, request)
          .subscribe({ next: onOk, error: onErr });
      } else {
        this.mpService
          .actualizarActividadApi(this.planActivo.id, this.editandoActividadId, request)
          .subscribe({ next: onOk, error: onErr });
      }
    } else {
      if (usApiUnidad) {
        this.mpService.agregarActividadVehiculoApi(this.vehicleId!, request).subscribe({ next: onOk, error: onErr });
      } else {
        this.mpService.agregarActividadApi(this.planActivo.id, request).subscribe({ next: onOk, error: onErr });
      }
    }
  }

  toggleGrupo(km: number): void {
    if (this.gruposAbiertos.has(km)) {
      this.gruposAbiertos.delete(km);
    } else {
      this.gruposAbiertos.add(km);
    }
  }

  estaAbierto(km: number): boolean {
    return this.gruposAbiertos.has(km);
  }

  estadoDelGrupo(alertas: AlertaActividad[]): EstadoAlerta {
    return this.mpService.estadoDelGrupo(alertas);
  }

  get totalVencidos(): number {
    if (!this.usaAlertasConOdometroUnidad()) {
      return 0;
    }
    return this.mpService.contarVencidos(this.vehiculoActivo, this.planActivo);
  }

  get totalProximos(): number {
    if (!this.usaAlertasConOdometroUnidad()) {
      return 0;
    }
    return this.mpService.contarProximos(this.vehiculoActivo, this.planActivo);
  }
}
