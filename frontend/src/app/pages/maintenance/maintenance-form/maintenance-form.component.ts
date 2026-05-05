import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { MaintenanceResponse } from '../../../models/maintenance/maintenance-response';
import { MaintenanceLinePayload, MaintenanceRequest, ServiceCategory } from '../../../models/maintenance/maintenance-request';
import { MantenimientoService, VehicleMaintenancePlanMatchDto, ActivityApiResponse } from '../../../services/mantenimiento.service';

export interface MaintenanceActivityRow {
  text: string;
  done: boolean;
}

export type ChecklistPriority = 'standard' | 'high_alert' | 'soon' | 'overdue_ok';

export interface ChecklistAlertRow {
  title: string;
  dueSecondary: string;
  dueTone: 'muted' | 'error' | 'warning' | 'amber';
  supplies: string;
  priority: ChecklistPriority;
  statusIcon: 'check_circle' | 'error' | 'warning';
}

@Component({
  selector: 'app-maintenance-form',
  templateUrl: './maintenance-form.component.html',
  styleUrls: ['./maintenance-form.component.scss']
})
export class MaintenanceFormComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  submitting = false;
  loadingMaintenance = false;
  /** ID del registro cuando la ruta es `/maintenance/edit/:id`; `null` en alta. */
  editingMaintenanceId: number | null = null;
  private loadMaintenanceSeq = 0;
  error = '';
  showAdvanced = false;

  formData = {
    vehicleId: null as number | null,
    serviceType: '',
    description: '',
    mileageAtService: null as number | null,
    /** KNOWN solo actualiza odómetro del vehículo en backend cuando hay km declarado como verificado. */
    odometerStatus: 'KNOWN' as 'KNOWN' | 'UNKNOWN' | 'ESTIMATED',
    /** Clasificación preventivo / correctivo / mixto para filtros e informes */
    serviceCategory: 'MIXED' as ServiceCategory,
    cost: null as number | null,
    serviceDate: '',
    nextServiceMileage: null as number | null,
    nextServiceDate: '',
    workshopName: '',
    workshopAddress: '',
    status: 'COMPLETED',
    notes: '',
    /** Fallas informadas por el cliente (se guardan como líneas SYMPTOM). */
    reportedIssues: ''
  };

  statuses = ['DRAFT', 'QUOTE', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  categoryOptions: { value: ServiceCategory; label: string }[] = [
    { value: 'PREVENTIVE', label: 'Preventivo' },
    { value: 'CORRECTIVE', label: 'Correctivo' },
    { value: 'MIXED', label: 'Mixto' }
  ];

  serviceTypeOptions = [
    'Mantenimiento Preventivo 10k',
    'Mantenimiento Preventivo 20k',
    'Correctivo de Emergencia',
    'Inspección General',
    'Mantenimiento preventivo',
    'Mantenimiento correctivo'
  ];

  activityLines: MaintenanceActivityRow[] = [{ text: '', done: false }];


  /** Datos de diseño para visualizar alertas de mantenimiento preventivo. */
  checklistAlerts: ChecklistAlertRow[] = [
    {
      title: 'Cambio de Aceite',
      dueSecondary: 'Vence en: 12,500 km',
      dueTone: 'muted',
      supplies: 'Aceite 5W30 (4L)',
      priority: 'standard',
      statusIcon: 'check_circle'
    },
    {
      title: 'Cambio Filtro Aceite',
      dueSecondary: 'Vence en: 12,500 km',
      dueTone: 'muted',
      supplies: 'Filtro GEN-2023',
      priority: 'standard',
      statusIcon: 'check_circle'
    },
    {
      title: 'Revisión de Frenos',
      dueSecondary: 'Vence en: 12,000 km (VENCIDO)',
      dueTone: 'error',
      supplies: 'Pastillas Cerámicas',
      priority: 'high_alert',
      statusIcon: 'error'
    },
    {
      title: 'Alineación y Balanceo',
      dueSecondary: 'Vence en: 13,000 km',
      dueTone: 'amber',
      supplies: 'N/A',
      priority: 'soon',
      statusIcon: 'warning'
    }
  ];

  /** Actividades desde `GET maintenance-plans/for-vehicle/:id`. */
  fleetPlanMatch: VehicleMaintenancePlanMatchDto | null = null;
  fleetPlanMatchLoading = false;
  manualCheckExtras: ChecklistAlertRow[] = [];

  /** Si el usuario modificó «Próximo kilometraje», dejamos de recalcular al cambiar km de visita o al cargar el plan (solo en alta). */
  private proximoKmEditadoPorUsuario = false;
  private silentProxKmWrite = false;
  /** Paso (km a sumar) elegido desde el combo; valores vienen del plan activo y presetes comunes cuando no hay plan. */
  proximoKmPasoElegido: number | null = null;

  private static readonly PASOS_GENERICOS_FALLBACK_KM = [5000, 8000, 10000, 15000, 20000];

  /** Lista ordenada única para el selector (intervalos del plan + pasos típicos). */
  get opcionesPasoKm(): number[] {
    const acts = this.fleetPlanMatch?.plan?.activities?.filter((a) => a?.isActive !== false);
    const desdePlan =
      acts
        ?.map((a) => Number(a.intervaloKm))
        .filter((k) => !Number.isNaN(k) && k > 0) ?? [];
    const unidos = [...desdePlan, ...MaintenanceFormComponent.PASOS_GENERICOS_FALLBACK_KM];
    return [...new Set(unidos)].sort((a, b) => a - b);
  }

  /** Kilometraje a sumar a la base (visita/ficha); valida contra las opciones actuales. */
  pasoProximoKmParaCalculo(): number {
    const opts = this.opcionesPasoKm;
    const cur = this.proximoKmPasoElegido;
    if (cur != null && opts.includes(cur)) return cur;
    return opts.length ? opts[0] : 10000;
  }

  private normalizarSeleccionPasoProximoKm(): void {
    const opts = this.opcionesPasoKm;
    if (!opts.length) {
      this.proximoKmPasoElegido = null;
      return;
    }
    if (this.proximoKmPasoElegido == null || !opts.includes(this.proximoKmPasoElegido)) {
      this.proximoKmPasoElegido = opts[0];
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private mpFleetService: MantenimientoService
  ) {}

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe((data) => {
      this.vehicles = data;
      this.syncFormWithRoute();
    });

    this.route.paramMap.subscribe(() => this.syncFormWithRoute());

    this.route.queryParamMap.subscribe(() => {
      if (!this.loadingMaintenance && this.editingMaintenanceId == null) {
        this.applyRouteDefaultsToForm();
      }
      this.reloadFleetPlanMatch();
    });
  }

  /** Al editar mantenemos la misma ruta pero cambiamos sólo pestaña (query). En alta navega a nuevo registro. */
  editOrNewBasePath(): (string | number)[] {
    return this.editingMaintenanceId != null
      ? ['/maintenance/edit', this.editingMaintenanceId]
      : ['/maintenance/new'];
  }

  get isEditingMaintenance(): boolean {
    return this.editingMaintenanceId != null;
  }

  private syncFormWithRoute(): void {
    const editId = this.parseEditRouteId();
    const wasEditing = this.editingMaintenanceId != null;
    this.editingMaintenanceId = editId;

    if (editId != null && this.vehicles.length === 0) {
      return;
    }

    if (editId != null) {
      this.loadMaintenanceForEdit(editId);
      return;
    }

    if (wasEditing) {
      this.resetNewFormBaseline();
    }

    this.applyRouteDefaultsToForm();
    this.reloadFleetPlanMatch();
  }

  private parseEditRouteId(): number | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (!raw?.trim()) {
      return null;
    }
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }

  private loadMaintenanceForEdit(id: number): void {
    const seq = ++this.loadMaintenanceSeq;
    this.loadingMaintenance = true;
    this.error = '';
    this.submitting = false;
    this.maintenanceService.getMaintenanceById(id).subscribe({
      next: (m) => {
        if (seq !== this.loadMaintenanceSeq) {
          return;
        }
        this.applyLoadedMaintenance(m);
        this.loadingMaintenance = false;
        this.reloadFleetPlanMatch();
      },
      error: () => {
        if (seq !== this.loadMaintenanceSeq) {
          return;
        }
        this.loadingMaintenance = false;
        this.error = 'No se pudo cargar el mantenimiento.';
      }
    });
  }

  private isoDateOnly(s?: string | null): string {
    if (!s?.trim()) {
      return '';
    }
    const t = s.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
      return t.slice(0, 10);
    }
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
      2,
      '0'
    )}`;
  }

  private applyLoadedMaintenance(m: MaintenanceResponse): void {
    this.manualCheckExtras = [];
    this.proximoKmEditadoPorUsuario = true;
    this.proximoKmPasoElegido = null;
    this.formData.notes = m.notes?.trim() ?? '';
    this.formData.vehicleId = m.vehicleId;
    this.formData.serviceType = m.serviceType?.trim() ?? '';
    const descTrim = (m.description ?? '').trim();
    this.formData.description = descTrim;

    const os = (m.odometerStatus || 'UNKNOWN').toUpperCase();
    if (os === 'KNOWN' || os === 'UNKNOWN' || os === 'ESTIMATED') {
      this.formData.odometerStatus = os as typeof this.formData.odometerStatus;
    } else {
      this.formData.odometerStatus = m.mileageAtService != null ? 'KNOWN' : 'UNKNOWN';
    }
    if (this.formData.odometerStatus === 'UNKNOWN') {
      this.formData.mileageAtService = null;
    } else {
      this.formData.mileageAtService =
        m.mileageAtService != null ? Number(m.mileageAtService) : null;
    }

    const sc = (m.serviceCategory || 'MIXED').toUpperCase();
    if (sc === 'PREVENTIVE' || sc === 'CORRECTIVE' || sc === 'MIXED') {
      this.formData.serviceCategory = sc as ServiceCategory;
    }

    this.formData.cost = m.cost != null ? Number(m.cost) : null;
    this.formData.serviceDate = this.isoDateOnly(m.serviceDate) || this.todayLocalIsoDate();
    this.formData.nextServiceMileage = m.nextServiceMileage != null ? Number(m.nextServiceMileage) : null;
    const nextDt = this.isoDateOnly(m.nextServiceDate);
    this.formData.nextServiceDate = nextDt ?? '';
    this.formData.workshopName = m.workshopName?.trim() ?? '';
    this.formData.workshopAddress = m.workshopAddress?.trim() ?? '';
    this.formData.status = (m.status || 'COMPLETED').trim();

    const items = m.lineItems ?? [];
    const ln = (t: string | undefined) => (t ?? '').toUpperCase();
    const performed = items
      .filter((li) => ln(String(li.lineType)) === 'PERFORMED')
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const symptoms = items
      .filter((li) => ln(String(li.lineType)) === 'SYMPTOM')
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((li) => (li.description ?? '').trim())
      .filter(Boolean);

    if (performed.length) {
      this.activityLines = performed.map((li) => ({
        text: (li.description ?? '').trim(),
        done: !!li.done
      }));
    } else if (descTrim) {
      this.activityLines = [{ text: descTrim, done: true }];
    } else {
      this.activityLines = [{ text: '', done: false }];
    }
    this.formData.reportedIssues = symptoms.join('\n');
  }

  private resetNewFormBaseline(): void {
    Object.assign(this.formData, {
      vehicleId: null,
      serviceType: '',
      description: '',
      mileageAtService: null,
      odometerStatus: 'KNOWN',
      serviceCategory: 'MIXED',
      cost: null,
      serviceDate: '',
      nextServiceMileage: null,
      nextServiceDate: '',
      workshopName: '',
      workshopAddress: '',
      status: 'COMPLETED',
      notes: '',
      reportedIssues: ''
    });
    this.manualCheckExtras = [];
    this.activityLines = [{ text: '', done: false }];
    this.error = '';
    this.proximoKmEditadoPorUsuario = false;
    this.proximoKmPasoElegido = null;
  }

  /**
   * Tras cargar match de plan en alta (evitar array vacío raro tras respuesta async).
   */
  private despuesDeFleetPlanMatchEnAlta(paraVehiculoId: number): void {
    if (this.isEditingMaintenance || paraVehiculoId !== this.formData.vehicleId) return;
    if (this.activityLines.length === 0) {
      this.activityLines = [{ text: '', done: false }];
    }
  }

  /** Normaliza el texto de actividad para comparar coincidencias (plan vs descripción). */
  private static normHead(txt: string | undefined): string {
    const t = (txt ?? '').split('(')[0].trim().toLowerCase().replace(/\s+/g, ' ');
    return t;
  }

  /** Inserta sugerencias del plan MP que **aún no** estén en «Descripción de trabajos» (acción opcional del usuario). */
  anadirActividadesDelPlanNoPresentes(): void {
    if (this.isEditingMaintenance || !this.formData.vehicleId) {
      return;
    }
    const acts =
      this.fleetPlanMatch?.plan?.activities?.filter((a) => a?.isActive !== false) ?? [];
    if (!acts.length) return;

    const headsEnUso = new Set(
      this.activityLines
        .map((r) => MaintenanceFormComponent.normHead(r.text))
        .filter(Boolean)
    );

    const nuevas: MaintenanceActivityRow[] = [];
    for (const a of acts) {
      const nombreRaw = (a.nombre ?? '').trim();
      if (!nombreRaw) continue;
      const h = MaintenanceFormComponent.normHead(nombreRaw);
      if (headsEnUso.has(h)) continue;
      headsEnUso.add(h);
      const km = Number(a.intervaloKm);
      const meses = a.intervaloMeses;
      const ref =
        !Number.isNaN(km) && km > 0
          ? ` (cada ${km.toLocaleString('es')} km${meses != null ? ` · ${meses} meses` : ''}${a.tipo ? ` · ${a.tipo}` : ''})`
          : '';
      nuevas.push({ text: nombreRaw + ref, done: false });
    }
    if (!nuevas.length) return;

    const sinColaVacias: MaintenanceActivityRow[] = [...this.activityLines];
    while (sinColaVacias.length && !(sinColaVacias[sinColaVacias.length - 1]?.text ?? '').trim()) {
      sinColaVacias.pop();
    }
    sinColaVacias.push(...nuevas);
    sinColaVacias.push({ text: '', done: false });
    this.activityLines = sinColaVacias;
  }

  private referenciaKmParaProximo(): number {
    const v = this.selectedVehicle;
    return Number(this.formData.mileageAtService ?? v?.mileage ?? 0) || 0;
  }

  /** Evita marcar como «manual» cuando el modelo actualiza próximo km por sugerencia. */
  private setProximoKmProgramatico(val: number | null): void {
    this.silentProxKmWrite = true;
    this.formData.nextServiceMileage = val;
    this.silentProxKmWrite = false;
  }

  sincronizarProximoKmSugerido(): void {
    if (this.isEditingMaintenance || this.proximoKmEditadoPorUsuario) {
      return;
    }
    const base = this.referenciaKmParaProximo();
    if (base <= 0) {
      return;
    }
    this.normalizarSeleccionPasoProximoKm();
    this.setProximoKmProgramatico(base + this.pasoProximoKmParaCalculo());
  }

  onSeleccionPasoProximoKmCambiada(): void {
    if (this.isEditingMaintenance) return;
    this.proximoKmEditadoPorUsuario = false;
    this.sincronizarProximoKmSugerido();
  }

  onProximoKmCampoPorUsuario(): void {
    if (this.silentProxKmWrite) return;
    this.proximoKmEditadoPorUsuario = true;
  }

  onMileageAtServiceChanged(): void {
    this.sincronizarProximoKmSugerido();
  }

  private applyRouteDefaultsToForm(): void {
    const qp = this.route.snapshot.queryParamMap;
    const vehicleId = qp.get('vehicleId');
    if (vehicleId) {
      this.formData.vehicleId = Number(vehicleId);
    }
    const catParam = qp.get('categoria');
    if (!this.formData.serviceType.trim()) {
      if (catParam === 'preventivo') {
        this.formData.serviceCategory = 'PREVENTIVE';
        this.formData.serviceType = 'Mantenimiento Preventivo 10k';
      } else if (catParam === 'correctivo') {
        this.formData.serviceCategory = 'CORRECTIVE';
        this.formData.serviceType = 'Correctivo de Emergencia';
      }
    }

    if (!((this.formData.serviceDate ?? '').trim())) {
      this.formData.serviceDate = this.todayLocalIsoDate();
    }

    const v = this.selectedVehicle;

    /** No copiar el odómetro de la ficha: si se deja ese mismo número, la visita parece nueva pero el sistema no puede avanzar el histórico. */
    if (this.formData.mileageAtService != null) {
      this.formData.odometerStatus = 'KNOWN';
    }

    const refParaProximo =
      Number(this.formData.mileageAtService ?? v?.mileage ?? 0) || 0;
    if (
      !this.proximoKmEditadoPorUsuario &&
      this.formData.nextServiceMileage == null &&
      refParaProximo > 0
    ) {
      this.normalizarSeleccionPasoProximoKm();
      this.setProximoKmProgramatico(refParaProximo + this.pasoProximoKmParaCalculo());
    }
  }

  /** Odómetro guardado actualmente en ficha (sirve como piso si informás kilometraje). */
  get odometroReferenciaFicha(): number | null {
    const m = this.selectedVehicle?.mileage;
    return m != null ? m : null;
  }

  get odometroFichaAyudaTxt(): string {
    const km = this.odometroReferenciaFicha;
    if (km == null) return '';
    if (this.isEditingMaintenance) {
      return `En ficha: ${km.toLocaleString('es')} km · podés conservar la lectura de esta visita o corregir el registro`;
    }
    return `En ficha: ${km.toLocaleString('es')} km · la lectura de esta visita debe ser mayor`;
  }

  /** Aviso inmediato bajo el campo km (solo en alta; coincide con validación del envío). */
  get mensajeAlertaKmContraFicha(): string | null {
    if (this.isEditingMaintenance) {
      return null;
    }
    const od = this.formData.odometerStatus;
    if (od !== 'KNOWN' && od !== 'ESTIMATED') {
      return null;
    }
    const pie = this.odometroReferenciaFicha;
    if (pie == null) {
      return null;
    }
    const mv = this.formData.mileageAtService;
    if (mv == null || Number.isNaN(Number(mv))) {
      return null;
    }
    const num = Number(mv);
    if (Number.isNaN(num)) {
      return null;
    }
    if (num > pie) {
      return null;
    }
    return (
      `No podés usar ${num.toLocaleString('es')} km: debe ser mayor al odómetro en ficha (${pie.toLocaleString('es')} km). ` +
      `Corregí la lectura o elegí «Sin kilometraje (cliente no informa)».`
    );
  }

  reloadFleetPlanMatch(): void {
    const id = this.formData.vehicleId;
    if (!id) {
      this.fleetPlanMatch = null;
      this.fleetPlanMatchLoading = false;
      if (!this.isEditingMaintenance) {
        this.activityLines = [{ text: '', done: false }];
      }
      return;
    }
    this.fleetPlanMatchLoading = true;
    const requestedFor = id;
    this.mpFleetService.obtenerMatchPlanPorVehiculo(id).subscribe({
      next: (m) => {
        if (requestedFor !== this.formData.vehicleId) {
          return;
        }
        this.fleetPlanMatch = m;
        this.fleetPlanMatchLoading = false;
        this.sincronizarProximoKmSugerido();
        this.despuesDeFleetPlanMatchEnAlta(requestedFor);
      },
      error: () => {
        if (requestedFor !== this.formData.vehicleId) {
          return;
        }
        this.fleetPlanMatch = null;
        this.fleetPlanMatchLoading = false;
        if (!this.isEditingMaintenance) {
          this.despuesDeFleetPlanMatchEnAlta(requestedFor);
        }
      }
    });
  }

  onVehicleIdChanged(): void {
    this.proximoKmEditadoPorUsuario = false;
    this.proximoKmPasoElegido = null;
    if (!this.isEditingMaintenance) {
      this.activityLines = [{ text: '', done: false }];
    }
    this.reloadFleetPlanMatch();
  }

  get selectedVehicle(): VehicleResponse | undefined {
    const id = this.formData.vehicleId;
    if (id == null) return undefined;
    return this.vehicles.find((v) => v.id === id);
  }

  get categoriaQuery(): 'correctivo' | 'preventivo' | null {
    const c = this.route.snapshot.queryParamMap.get('categoria');
    return c === 'correctivo' || c === 'preventivo' ? c : null;
  }

  /** Flujo pantalla cuando venís desde ?categoria= o elegís tipo en el formulario. */
  get isPreventiveUx(): boolean {
    return this.categoriaQuery === 'preventivo' || this.formData.serviceCategory === 'PREVENTIVE';
  }

  get isCorrectiveUx(): boolean {
    return this.categoriaQuery === 'correctivo' || this.formData.serviceCategory === 'CORRECTIVE';
  }

  get symptomLines(): string[] {
    return this.formData.reportedIssues
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Actividades activas del plan MP matcheado para el vehículo (solo lectura métricas plantilla). */
  get cuentaActividadesPlanActivas(): number {
    const list = this.fleetPlanMatch?.plan?.activities?.filter((a) => a?.isActive !== false);
    return list?.length ?? 0;
  }

  /**
   * Iguala una fila de «Descripción de trabajos» con una actividad del plan MP (`nombre`).
   */
  private findPlanActivityForLineText(lineText: string | undefined | null): ActivityApiResponse | undefined {
    const raw = (lineText ?? '').trim();
    if (!raw) return undefined;
    const head = raw.split('(')[0].trim().toLowerCase().replace(/\s+/g, ' ');
    if (!head) return undefined;
    const fromPlan =
      this.fleetPlanMatch?.plan?.activities?.filter((a) => a?.isActive !== false) ?? [];
    for (const a of fromPlan) {
      const key = (a.nombre ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!key) continue;
      if (head === key || head.startsWith(key + ' ') || raw.toLowerCase().startsWith(key + ' (')) {
        return a;
      }
    }
    return undefined;
  }

  /** Si aún no hay texto en «Descripción de trabajos», ubicar chequeo contra filas por nombre del MP. */
  private findDescLineForPlanNombre(nombrePlan: string | undefined | null): MaintenanceActivityRow | undefined {
    const key = (nombrePlan ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) return undefined;
    for (const row of this.activityLines) {
      const raw = (row.text ?? '').trim();
      if (!raw) continue;
      const head = raw.split('(')[0].trim().toLowerCase().replace(/\s+/g, ' ');
      if (!head) continue;
      if (head === key || head.startsWith(key + ' ') || raw.toLowerCase().startsWith(key + ' (')) {
        return row;
      }
    }
    return undefined;
  }

  /** Filas de tabla alineadas 1:1 con «Descripción de trabajos» (solo líneas con texto). */
  private checklistRowsFromActivityLines(): ChecklistAlertRow[] {
    const fuentePlan = this.fleetPlanMatch?.plan?.fuente?.trim() || 'Usuario';
    return this.activityLines
      .filter((r) => r.text.trim())
      .map((r) => {
        const trimmed = r.text.trim();
        const openP = trimmed.indexOf('(');
        const closeP = trimmed.lastIndexOf(')');
        const tituloPrincipal =
          openP >= 0 ? trimmed.slice(0, openP).trim() || trimmed : trimmed;
        const innerParen =
          openP >= 0 && closeP > openP ? trimmed.slice(openP + 1, closeP).trim() : '';
        const planAct = this.findPlanActivityForLineText(trimmed);
        let dueSecondary: string;
        if (planAct) {
          dueSecondary = `Plan MP · cada ${planAct.intervaloKm} km · cada ${planAct.intervaloMeses} meses (${planAct.tipo})`;
        } else if (innerParen.length) {
          dueSecondary = innerParen;
        } else {
          dueSecondary = 'Fuera del plan MP · trabajo añadido en esta visita';
        }
        const supplies = planAct ? fuentePlan : '—';
        const statusIcon: 'check_circle' | 'error' | 'warning' = r.done ? 'check_circle' : 'warning';
        const tituloMostrar =
          tituloPrincipal.length > 110 ? `${tituloPrincipal.slice(0, 107)}…` : tituloPrincipal;
        return {
          title: tituloMostrar,
          dueSecondary,
          dueTone: 'muted',
          supplies,
          priority: 'standard',
          statusIcon
        };
      });
  }

  get checklistTableRows(): ChecklistAlertRow[] {
    const extras = this.manualCheckExtras;

    if (this.fleetPlanMatchLoading && this.formData.vehicleId) {
      return [
        {
          title: 'Consultando plan del vehículo…',
          dueSecondary: 'Marca / modelo / año del taller',
          dueTone: 'muted',
          supplies: '-',
          priority: 'standard',
          statusIcon: 'warning'
        },
        ...extras
      ];
    }

    /** Tabla = espejo de «Descripción de trabajos» cuando ya hay algo escrito ahí */
    const fromDescription = this.checklistRowsFromActivityLines();
    if (this.formData.vehicleId && fromDescription.length > 0) {
      return [...fromDescription, ...extras];
    }

    const fromPlan = this.fleetPlanMatch?.plan?.activities?.filter((a) => a?.isActive !== false);
    if (fromPlan?.length && this.formData.vehicleId) {
      const rows: ChecklistAlertRow[] = fromPlan.map((a) => {
        const linked = this.findDescLineForPlanNombre(a.nombre);
        const statusIcon: 'check_circle' | 'error' | 'warning' =
          linked == null ? 'warning' : linked.done ? 'check_circle' : 'warning';
        return {
          title: a.nombre,
          dueSecondary: `Cada ${a.intervaloKm} km · cada ${a.intervaloMeses} meses (${a.tipo})`,
          dueTone: 'muted',
          supplies: this.fleetPlanMatch?.plan?.fuente || 'Manual taller',
          priority: 'standard',
          statusIcon
        };
      });
      return [...rows, ...extras];
    }

    if (this.formData.vehicleId && this.fleetPlanMatch?.matchMode === 'NONE' && !this.fleetPlanMatchLoading) {
      return [
        {
          title: 'Sin plan cargado para este vehículo',
          dueSecondary: this.fleetPlanMatch.hint || 'Creá un plan con igual marca/modelo/año.',
          dueTone: 'warning',
          supplies: '-',
          priority: 'soon',
          statusIcon: 'warning'
        },
        ...extras
      ];
    }

    if (!this.formData.vehicleId) {
      return [...this.checklistAlerts, ...extras];
    }

    return extras.length
      ? extras
      : [
          {
            title: 'Seleccioná un vehículo',
            dueSecondary: 'Así cargamos las actividades del plan MP.',
            dueTone: 'muted',
            supplies: '-',
            priority: 'standard',
            statusIcon: 'warning'
          }
        ];
  }

  flowQuery(tab: 'preventivo' | 'correctivo'): Record<string, string | number> {
    const q: Record<string, string | number> = { categoria: tab };
    if (this.formData.vehicleId) {
      q['vehicleId'] = this.formData.vehicleId;
    }
    return q;
  }

  historialQuery(): Record<string, string | number> {
    const q: Record<string, string | number> = {};
    if (this.formData.vehicleId) {
      q['vehicleId'] = this.formData.vehicleId;
    }
    const cat = this.categoriaQuery;
    if (cat) {
      q['categoria'] = cat;
    }
    return q;
  }

  setStatusShortcut(status: 'COMPLETED' | 'IN_PROGRESS') {
    this.formData.status = status;
  }

  addActivity(): void {
    this.activityLines.push({ text: '', done: false });
  }

  onOdometerModeChange(): void {
    if (this.formData.odometerStatus === 'UNKNOWN') {
      this.formData.mileageAtService = null;
    }
    this.sincronizarProximoKmSugerido();
  }

  private buildLineItems(): MaintenanceLinePayload[] {
    const items: MaintenanceLinePayload[] = [];
    let ord = 0;
    for (const row of this.activityLines.filter((a) => a.text.trim())) {
      items.push({
        lineType: 'PERFORMED',
        description: row.text.trim(),
        done: row.done,
        includedInRecord: true,
        sortOrder: ord++
      });
    }
    const symptoms = this.formData.reportedIssues
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const s of symptoms) {
      items.push({
        lineType: 'SYMPTOM',
        description: s,
        done: false,
        includedInRecord: true,
        sortOrder: ord++
      });
    }
    return items;
  }

  private activitiesText(): string {
    return this.activityLines
      .filter((a) => a.text.trim())
      .map((a) => (a.done ? '✓ ' : '') + a.text.trim())
      .join(' · ');
  }

  trackByIdx(index: number, _row: MaintenanceActivityRow): number {
    return index;
  }

  /** ISO yyyy-mm-dd en zona horaria local (valor esperado por `<input type="date">` y por el backend). */
  private todayLocalIsoDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatHttpMaintenanceError(err: unknown): string {
    const body = err as { error?: { message?: string; errors?: unknown } };
    const payload = body?.error;
    const base =
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : 'Error al guardar mantenimiento';
    const errs = payload?.errors;
    if (!Array.isArray(errs) || errs.length === 0) {
      return base;
    }
    const parts = errs
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean);
    if (parts.length === 0) {
      return base;
    }
    return base === 'Error de validación' ? parts.join(' · ') : `${base}: ${parts.join(' · ')}`;
  }

  onSubmit() {
    if (!this.formData.vehicleId || !this.formData.serviceType) {
      this.error = 'Vehículo y tipo de servicio son obligatorios';
      return;
    }

    const od = this.formData.odometerStatus;
    const mileageProvided = this.formData.mileageAtService;
    const mileageForSubmit: number | undefined =
      od === 'UNKNOWN'
        ? undefined
        : mileageProvided != null && !Number.isNaN(Number(mileageProvided))
          ? Number(mileageProvided)
          : undefined;
    if (
      !this.isEditingMaintenance &&
      (od === 'KNOWN' || od === 'ESTIMATED') &&
      mileageForSubmit !== undefined
    ) {
      const pie = this.odometroReferenciaFicha;
      if (pie != null && mileageForSubmit <= pie) {
        const p = pie.toLocaleString('es');
        const c = mileageForSubmit.toLocaleString('es');
        this.error =
          `Estás guardando ${c} km igual o menor que el último cargado en ficha (${p} km): el sistema no puede avanzar el odómetro. ` +
          `Indicá una lectura mayor a la de la ficha, o elegí «Sin kilometraje (cliente no informa)» si todavía no tenés nueva lectura.`;
        return;
      }
    }

    if ((od === 'KNOWN' || od === 'ESTIMATED') && mileageForSubmit === undefined) {
      this.error =
        od === 'ESTIMATED'
          ? 'Indique un kilometraje aproximado o cambie el estado del odómetro a «Sin lectura».'
          : 'Indique el kilometraje actual o seleccione «Sin kilometraje / cliente no informa».';
      return;
    }

    this.submitting = true;
    this.error = '';

    const mergedDescription = this.activitiesText() || undefined;
    const lineItems = this.buildLineItems();

    const serviceDateSubmit = ((this.formData.serviceDate ?? '').trim() || this.todayLocalIsoDate());

    const request: MaintenanceRequest = {
      vehicleId: this.formData.vehicleId,
      serviceType: this.formData.serviceType,
      description: mergedDescription || undefined,
      mileageAtService: mileageForSubmit,
      odometerStatus: od,
      serviceCategory: this.formData.serviceCategory,
      cost: this.formData.cost ?? undefined,
      serviceDate: serviceDateSubmit,
      nextServiceMileage: this.formData.nextServiceMileage ?? undefined,
      nextServiceDate: this.formData.nextServiceDate || undefined,
      workshopName: this.formData.workshopName || undefined,
      workshopAddress: this.formData.workshopAddress || undefined,
      status: this.formData.status || undefined,
      notes: this.formData.notes || undefined,
      lineItems: lineItems.length ? lineItems : undefined
    };

    const editId = this.editingMaintenanceId;
    const save$ =
      editId != null
        ? this.maintenanceService.updateMaintenance(editId, request)
        : this.maintenanceService.createMaintenance(request);

    save$.subscribe({
      next: () => {
        const cat = this.route.snapshot.queryParamMap.get('categoria');
        const q: Record<string, number | string> = { vehicleId: this.formData.vehicleId! };
        if (cat === 'correctivo' || cat === 'preventivo') {
          q['categoria'] = cat;
        }
        void this.router.navigate(['/maintenance'], { queryParams: q });
      },
      error: (err) => {
        this.submitting = false;
        this.error = this.formatHttpMaintenanceError(err);
      }
    });
  }

  goBack() {
    const cat = this.route.snapshot.queryParamMap.get('categoria');
    const q: Record<string, number | string> = {};
    if (this.formData.vehicleId) {
      q['vehicleId'] = this.formData.vehicleId;
    }
    if (cat === 'correctivo' || cat === 'preventivo') {
      q['categoria'] = cat;
    }
    void this.router.navigate(['/maintenance'], { queryParams: Object.keys(q).length ? q : undefined });
  }
}
