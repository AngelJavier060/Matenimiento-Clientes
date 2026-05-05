import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import {
  ActivityApiRequest,
  ActivityApiResponse,
  MantenimientoService,
  VehicleMaintenancePlanMatchDto
} from '../../../services/mantenimiento.service';

/** Chips de alerta por fila en «Plan aplicado» (lista flota). */
export interface FleetPlanActivityAlertChip {
  text: string;
  tone: 'danger' | 'warn' | 'info';
}
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { MaintenanceResponse } from '../../../models/maintenance/maintenance-response';

@Component({
  selector: 'app-maintenance-list',
  templateUrl: './maintenance-list.component.html',
  styleUrls: ['./maintenance-list.component.scss']
})
export class MaintenanceListComponent implements OnInit, OnDestroy {
  vehicles: VehicleResponse[] = [];
  maintenances: MaintenanceResponse[] = [];
  selectedVehicleId: number | null = null;
  loading = false;
  /** Filtro desde el menú lateral: correctivo | preventivo */
  filterCategoria: 'correctivo' | 'preventivo' | null = null;

  /**
   * Sólo placas donde hay plan guardado en ficha (Vincular plan / edición MMY preventivo): `maintenancePlanId`.
   * No incluye las que sólo tienen match automático MMY.
   */
  loadingFleetVinculos = false;
  /** Resolve GET for-vehicle por id (sólo filas que ya muestramos). */
  fleetLinkageCache: Record<number, VehicleMaintenancePlanMatchDto | null> = {};
  /** Actividades MMY/catálogo por `resolvedPlanId` (plantilla); para opciones «Agregar desde plantilla». */
  fleetCatalogByPlanId: Record<number, ActivityApiResponse[]> = {};
  /** Expandido tipo acordeón: fila exterior por vehículo */
  fleetAccordionExpanded: Record<number, boolean> = {};
  /** Acordeón “Plan aplicado” interior por vehículo */
  fleetInnerPlanAccordion: Record<number, boolean> = {};

  /** Libreto preventivo en ventana modal (detalle desde «Placas vinculadas»). */
  libroModalVehicleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private mpService: MantenimientoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe((data) => {
      this.vehicles = data;
      this.applyRouteParams();
      if (this.filterCategoria === 'preventivo') {
        this.reloadVinculosPlacasFleet();
      }
    });

    this.route.queryParamMap.subscribe(() => {
      const wasPrev = this.filterCategoria === 'preventivo';
      this.applyRouteParams();
      const isPrev = this.filterCategoria === 'preventivo';
      if (isPrev) {
        this.reloadVinculosPlacasFleet();
      } else if (wasPrev) {
        this.fleetLinkageCache = {};
        this.fleetCatalogByPlanId = {};
      }
    });
  }

  ngOnDestroy(): void {
    if (this.libroModalVehicleId != null) {
      document.body.style.overflow = '';
    }
  }

  get pageTitle(): string {
    if (this.filterCategoria === 'correctivo') return 'Mantenimientos · Correctivo';
    if (this.filterCategoria === 'preventivo') return 'Mantenimientos · Preventivo';
    return 'Mantenimientos';
  }

  get displayedMaintenances(): MaintenanceResponse[] {
    const cat = this.filterCategoria;
    if (!cat) {
      return this.maintenances;
    }
    return this.maintenances.filter((m) => this.matchesCategoria(m, cat));
  }

  /** Vehículos con plan preventivo persistido en ficha → filas posibles para el panel inferior. */
  get vehiclesPlacasVinculadas(): VehicleResponse[] {
    return this.vehicles
      .filter((v) => v.maintenancePlanId != null && v.maintenancePlanId > 0)
      .slice()
      .sort((a, b) => (a.licensePlate || '—').localeCompare(b.licensePlate || '—', 'es', { sensitivity: 'base' }));
  }

  trackByVehicleId(_: number, v: VehicleResponse): number {
    return v.id;
  }

  linkageFor(v: VehicleResponse): VehicleMaintenancePlanMatchDto | null {
    return this.fleetLinkageCache[v.id] ?? null;
  }

  /** Subtítulo del modal libro (vehículo + placa). */
  get libroModalTitulo(): string {
    const vid = this.libroModalVehicleId;
    if (vid == null) {
      return '';
    }
    const v = this.vehicles.find((x) => x.id === vid);
    if (!v) {
      return `Vehículo #${vid}`;
    }
    const lp = v.licensePlate?.trim();
    const base = `${v.brand} ${v.model}`.trim();
    return lp ? `${base} — ${lp}` : base || `Unidad ${vid}`;
  }

  /** Encabezado del historial bajo vista preventiva */
  get selectedVehicleLabel(): string {
    const v = this.vehicles.find((x) => x.id === this.selectedVehicleId);
    if (!v) {
      return '';
    }
    const placa = v.licensePlate?.trim();
    return placa ? `${v.brand} ${v.model} (${placa})` : `${v.brand} ${v.model}`;
  }

  linkagePlateDisplay(lg: VehicleMaintenancePlanMatchDto | null, v: VehicleResponse): string {
    if (lg?.licensePlate?.trim()) return lg.licensePlate.trim();
    return v.licensePlate?.trim() || '(sin placa en vehículo)';
  }

  linkagePlanActiveActivities(lg: VehicleMaintenancePlanMatchDto | null): ActivityApiResponse[] {
    const acts = lg?.plan?.activities;
    if (!acts?.length) return [];
    return acts.filter((a) => a?.isActive !== false);
  }

  linkagePlanActivities(lg: VehicleMaintenancePlanMatchDto | null): { nombre: string; km: number; meses: number }[] {
    return this.linkagePlanActiveActivities(lg).map((a) => ({
      nombre: a.nombre || 'Actividad',
      km: a.intervaloKm,
      meses: a.intervaloMeses
    }));
  }

  /**
   * Alertas por línea del plan **solo para esta unidad**: km/fecha guardados (`vehicleMileage`,
   * `lastServiceMileage` / `lastServiceDate`). Sin ciclos genéricos “desde odómetro 0” (plantilla MMY).
   */
  fleetPlanActivityAlerts(
    lg: VehicleMaintenancePlanMatchDto | null,
    act: ActivityApiResponse
  ): FleetPlanActivityAlertChip[] {
    const out: FleetPlanActivityAlertChip[] = [];
    if (!lg?.plan || act.isActive === false) return out;

    const intervalKm = act.intervaloKm > 0 ? act.intervaloKm : 0;
    const intervalMes = act.intervaloMeses != null && act.intervaloMeses > 0 ? act.intervaloMeses : 0;
    const nombre = (act.nombre || 'Actividad').trim() || 'Actividad';

    const fechaActual = new Date();
    const fechaUltimo = this.linkageParsedLastDate(lg.lastServiceDate);
    const fmtKm = (n: number) => n.toLocaleString('es');

    let retrasoMes = 0;
    if (fechaUltimo != null && intervalMes > 0) {
      retrasoMes = this.mpService.mesesRetrasoRespectoUltimoServicio(
        fechaUltimo,
        fechaActual,
        intervalMes
      );
      if (retrasoMes > 0) {
        out.push({
          tone: 'danger',
          text:
            retrasoMes === 1
              ? `${nombre} · tiempo: ~1 mes de más (cada ${intervalMes} mes)`
              : `${nombre} · tiempo: ~${retrasoMes} meses de más (cada ${intervalMes} mes)`
        });
      }
    }

    const kmRaw = lg.vehicleMileage;
    if (kmRaw == null || kmRaw < 0) {
      out.push({
        tone: 'info',
        text: `${nombre}: sin kilometraje actual registrado para esta unidad — los avisos por km usan ese dato.`
      });
      return out;
    }

    const kmActual = kmRaw;

    if (intervalKm <= 0) {
      out.push({
        tone: 'info',
        text: `${nombre}: sin intervalo km en el plan (solo fecha u observación manual).`
      });
      return out;
    }

    const lastKm = lg.lastServiceMileage;
    const tieneUltimoKm = lastKm != null && typeof lastKm === 'number' && lastKm >= 0;

    if (!tieneUltimoKm) {
      out.push({
        tone: 'info',
        text:
          `${nombre}: km actual ${fmtKm(kmActual)} · cada ${fmtKm(intervalKm)} km — ` +
          `registrate un mantenimiento con km para esta placa y verás aquí si va vencido o próximo.`
      });
      return out;
    }

    const safeLastKm = lastKm as number;
    const retrasoKm = this.mpService.kmRetrasoRespectoUltimoServicio(kmActual, safeLastKm, intervalKm);
    const vencimientoPrimero = safeLastKm + intervalKm;

    if (retrasoKm > 0) {
      out.push({
        tone: 'danger',
        text:
          `${nombre}: pasó el ciclo · +${fmtKm(retrasoKm)} km desde ${fmtKm(vencimientoPrimero)} km ` +
          `(último registro ${fmtKm(safeLastKm)} km · cada ${fmtKm(intervalKm)} km)`
      });
      return out;
    }

    let siguiente = safeLastKm + intervalKm;
    while (siguiente <= kmActual) {
      siguiente += intervalKm;
    }
    const faltanPara = siguiente - kmActual;
    const umbralProximo = Math.min(900, Math.max(250, Math.round(intervalKm * 0.12)));

    if (faltanPara <= umbralProximo) {
      out.push({
        tone: 'warn',
        text:
          `${nombre}: próximo ciclo cercano · faltan ~${fmtKm(faltanPara)} km (referencia ~${fmtKm(siguiente)} km)`
      });
    } else {
      out.push({
        tone: 'info',
        text:
          `${nombre}: OK · referencia siguiente ~${fmtKm(siguiente)} km (${fmtKm(faltanPara)} km más)`
      });
    }

    return out;
  }

  private linkageParsedLastDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  fleetPlanActivitiesWithAlerts(
    lg: VehicleMaintenancePlanMatchDto | null
  ): Array<{ act: ActivityApiResponse; alerts: FleetPlanActivityAlertChip[] }> {
    return this.linkagePlanActiveActivities(lg).map((act) => ({
      act,
      alerts: this.fleetPlanActivityAlerts(lg, act)
    }));
  }

  /**
   * Alertas desde el compromiso único por vehículo (km y/o fecha en ficha), independiente del plan por líneas.
   */
  fleetVehicleCommitmentAlerts(lg: VehicleMaintenancePlanMatchDto | null): FleetPlanActivityAlertChip[] {
    if (!lg) return [];
    const cKmRaw = lg.nextCommittedServiceMileage;
    const cDateIso = lg.nextCommittedServiceDate?.trim() || '';

    const hasKm = cKmRaw != null && cKmRaw >= 0;
    if (!hasKm && !cDateIso) return [];

    const out: FleetPlanActivityAlertChip[] = [];
    const km = lg.vehicleMileage;
    const fmtKm = (n: number) => n.toLocaleString('es');

    if (hasKm) {
      const cKm = cKmRaw as number;
      if (km != null && km >= 0) {
        const delta = km - cKm;
        if (delta > 0) {
          out.push({
            tone: 'danger',
            text: `Compromiso (km): +${fmtKm(delta)} km sobre la meta pactada (${fmtKm(cKm)} km)`
          });
        } else if (delta <= 0 && delta >= -500) {
          out.push({
            tone: 'warn',
            text: `Compromiso (km): quedan ~${fmtKm(Math.abs(delta))} km hasta ${fmtKm(cKm)} km`
          });
        }
      } else {
        out.push({
          tone: 'info',
          text: `Compromiso (km): objetivo ${fmtKm(cKm)} km — cargá el odómetro actual en la ficha para comparar.`
        });
      }
    }

    if (cDateIso) {
      const d = new Date(`${cDateIso}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
        if (diffDays > 0) {
          out.push({
            tone: 'danger',
            text: `Compromiso (fecha): ya pasó (${this.linkageCommittedDateFriendly(cDateIso)})`
          });
        } else if (diffDays <= 0 && diffDays >= -14) {
          const daysLeft = Math.abs(diffDays);
          out.push({
            tone: 'warn',
            text:
              daysLeft === 0
                ? `Compromiso (fecha): hoy (${this.linkageCommittedDateFriendly(cDateIso)})`
                : `Compromiso (fecha): quedan ${daysLeft} día${daysLeft === 1 ? '' : 's'} (${this.linkageCommittedDateFriendly(
                    cDateIso
                  )})`
          });
        }
      }
    }

    return out;
  }

  private linkageCommittedDateFriendly(iso: string): string {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]}, ${d.getFullYear()}`;
  }

  linkagePlanSubtitle(lg: VehicleMaintenancePlanMatchDto | null): string {
    const p = lg?.plan;
    if (!p) return '';
    const motorPart = (p.motor || '').trim() ? ` · ${String(p.motor).trim()}` : '';
    return `${p.marca} ${p.modelo} (${p.anio})${motorPart} — plan #${p.id}`;
  }

  linkageKmProgressPercent(lg: VehicleMaintenancePlanMatchDto | null): number {
    const km = lg?.vehicleMileage;
    if (km == null || km < 0) return 12;
    const mod = km % 60000;
    return Math.min(96, Math.max(18, Math.round((mod / 60000) * 100)));
  }

  linkageKmBarTone(lg: VehicleMaintenancePlanMatchDto | null): 'blue' | 'amber' | 'red' {
    const p = this.linkageKmProgressPercent(lg);
    if (p >= 82) return 'red';
    if (p >= 38) return 'amber';
    return 'blue';
  }

  linkageKmSummaryDisplay(lg: VehicleMaintenancePlanMatchDto | null): string {
    const km = lg?.vehicleMileage;
    if (km == null) return '—';
    return km.toLocaleString('es', { minimumFractionDigits: 0 });
  }

  linkageLastServiceFriendly(lg: VehicleMaintenancePlanMatchDto | null): string {
    const iso = lg?.lastServiceDate;
    if (!iso) return 'Sin fecha';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
  }

  linkageDaysSinceLastServiceLabel(lg: VehicleMaintenancePlanMatchDto | null): string {
    const iso = lg?.lastServiceDate;
    if (!iso) return 'Sin fecha de último mantenimiento en historial';
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'Reciente';
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  }

  linkageFleetStatusBadge(lg: VehicleMaintenancePlanMatchDto | null): 'operativo' | 'sin-plan' | 'atencion' {
    const m = (lg?.matchMode || '').toUpperCase();
    if (m === 'NONE') return 'sin-plan';
    const iso = lg?.lastServiceDate;
    if (!iso) return 'operativo';
    const ms = new Date(`${iso}T12:00:00`).getTime();
    if (Number.isNaN(ms)) return 'operativo';
    const days = Math.floor((Date.now() - ms) / 86400000);
    if (days > 180) return 'atencion';
    return 'operativo';
  }

  linkageFleetStatusLabel(lg: VehicleMaintenancePlanMatchDto | null): string {
    switch (this.linkageFleetStatusBadge(lg)) {
      case 'sin-plan':
        return 'Sin plan';
      case 'atencion':
        return 'Revisar fecha';
      default:
        return 'Operativo';
    }
  }

  toggleFleetRowAccordion(vid: number): void {
    const next = !this.fleetAccordionExpanded[vid];
    this.fleetAccordionExpanded = { ...this.fleetAccordionExpanded, [vid]: next };
  }

  isFleetRowOpen(vid: number): boolean {
    return !!this.fleetAccordionExpanded[vid];
  }

  toggleFleetInnerPlan(vid: number): void {
    const next = !this.fleetInnerPlanAccordion[vid];
    this.fleetInnerPlanAccordion = { ...this.fleetInnerPlanAccordion, [vid]: next };
  }

  isFleetInnerPlanOpen(vid: number): boolean {
    return !!this.fleetInnerPlanAccordion[vid];
  }

  /** Abrir ventana flotante del libro preventivo sólo para esta placa (alinea selector y datos). */
  abrirLibroModalPlaca(vid: number): void {
    if (this.selectedVehicleId !== vid) {
      this.onVehicleChange(vid, true);
    }
    document.body.style.overflow = 'hidden';
    this.libroModalVehicleId = vid;
  }

  cerrarLibroModalPlaca(): void {
    if (this.libroModalVehicleId == null) {
      return;
    }
    document.body.style.overflow = '';
    this.libroModalVehicleId = null;
    if (this.filterCategoria === 'preventivo') {
      this.reloadVinculosPlacasFleet();
    }
  }

  /** Misma lógica que el módulo de la página, al vincular plan desde el modal. */
  onPlanLinkageChangedLibroModal(): void {
    this.onPlanLinkageChangedFromChild();
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarLibroModal(): void {
    if (this.libroModalVehicleId !== null) {
      this.cerrarLibroModalPlaca();
    }
  }

  categoryLabel(cat?: string): string {
    switch ((cat || '').toUpperCase()) {
      case 'PREVENTIVE':
        return 'Preventivo';
      case 'CORRECTIVE':
        return 'Correctivo';
      case 'MIXED':
        return 'Mixto';
      default:
        return '';
    }
  }

  mileageLabel(m: MaintenanceResponse): string | null {
    if (m.mileageAtService != null) {
      const tag =
        (m.odometerStatus || '').toUpperCase() === 'ESTIMATED'
          ? ' (est.)'
          : '';
      return `${m.mileageAtService} km${tag}`;
    }
    if ((m.odometerStatus || '').toUpperCase() === 'UNKNOWN') {
      return 'Km no informado';
    }
    return null;
  }

  /** Etiqueta del chip de filtro (null si vista general). */
  get filterLabel(): string | null {
    if (this.filterCategoria === 'correctivo') return 'Correctivo';
    if (this.filterCategoria === 'preventivo') return 'Preventivo';
    return null;
  }

  private applyRouteParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const cat = params.get('categoria');
    this.filterCategoria = cat === 'correctivo' || cat === 'preventivo' ? cat : null;

    const vehicleIdStr = params.get('vehicleId');
    if (!vehicleIdStr) {
      this.selectedVehicleId = null;
      this.maintenances = [];
      return;
    }
    const vid = Number(vehicleIdStr);
    if (Number.isNaN(vid)) {
      return;
    }
    if (this.selectedVehicleId !== vid) {
      this.selectedVehicleId = vid;
      this.onVehicleChange(vid, false);
    }
  }

  private matchesCategoria(m: MaintenanceResponse, cat: 'correctivo' | 'preventivo'): boolean {
    const sc = (m.serviceCategory || '').toUpperCase();
    if (sc === 'MIXED') {
      return true;
    }
    if (cat === 'preventivo' && sc === 'PREVENTIVE') {
      return true;
    }
    if (cat === 'correctivo' && sc === 'CORRECTIVE') {
      return true;
    }
    if (!m.serviceCategory || m.serviceCategory.trim() === '') {
      return this.matchesCategoriaLegacy(m.serviceType, cat);
    }
    return false;
  }

  private matchesCategoriaLegacy(serviceType: string | undefined, cat: 'correctivo' | 'preventivo'): boolean {
    const t = (serviceType ?? '').trim().toLowerCase();
    if (!t) {
      return false;
    }
    if (cat === 'correctivo') {
      return (
        t.includes('correct') ||
        t === 'correctivo' ||
        t.includes('mantenimiento correctivo') ||
        t.includes('emergencia')
      );
    }
    return (
      t.includes('prevent') ||
      t === 'preventivo' ||
      t.includes('mantenimiento preventivo')
    );
  }

  private syncQueryParamsToUrl(vehicleId: number | null): void {
    const q: Record<string, string | number> = {};
    if (this.filterCategoria) {
      q['categoria'] = this.filterCategoria;
    }
    if (vehicleId != null) {
      q['vehicleId'] = vehicleId;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: q,
      replaceUrl: true
    });
  }

  /** @param syncUrl cuando false (ya venimos por URL), no reescribe query string */
  onVehicleChange(vehicleId: number | null, syncUrl = true) {
    this.selectedVehicleId = vehicleId;
    if (syncUrl) {
      this.syncQueryParamsToUrl(vehicleId);
    }
    if (!vehicleId) {
      this.maintenances = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.maintenanceService.getMaintenancesByVehicle(vehicleId).subscribe({
      next: (data) => {
        this.maintenances = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  /**
   * Carga vínculo plan ↔ vehículo para cada placa que ya tiene `maintenancePlanId` guardado en ficha.
   */
  reloadVinculosPlacasFleet(): void {
    if (this.filterCategoria !== 'preventivo') {
      return;
    }
    const vinc = this.vehiclesPlacasVinculadas;
    if (vinc.length === 0) {
      this.fleetLinkageCache = {};
      this.fleetCatalogByPlanId = {};
      this.loadingFleetVinculos = false;
      return;
    }
    this.loadingFleetVinculos = true;
    const reqs = vinc.map((v) =>
      this.mpService.obtenerMatchPlanPorVehiculo(v.id).pipe(
        catchError(() => of(null)),
        map((m) => ({ id: v.id, m }))
      )
    );
    forkJoin(reqs)
      .pipe(
        switchMap((rows) => {
          const planIds = new Set<number>();
          rows.forEach((r) => {
            const m = r.m;
            if (m?.resolvedPlanId != null && m.resolvedPlanId > 0) {
              const mode = (m.matchMode || '').toUpperCase();
              if (mode !== 'NONE') {
                planIds.add(m.resolvedPlanId);
              }
            }
          });
          if (planIds.size === 0) {
            this.fleetCatalogByPlanId = {};
            return of(rows);
          }
          const catReqs = [...planIds].map((pid) =>
            this.mpService.obtenerPlanApi(pid).pipe(
              map((p) => ({
                pid,
                acts: (p.activities ?? []).filter((a) => a?.isActive !== false)
              })),
              catchError(() =>
                of({
                  pid,
                  acts: [] as ActivityApiResponse[]
                })
              )
            )
          );
          return forkJoin(catReqs).pipe(
            map((list) => {
              const cat: Record<number, ActivityApiResponse[]> = {};
              list.forEach(({ pid, acts }) => {
                cat[pid] = acts;
              });
              this.fleetCatalogByPlanId = cat;
              return rows;
            })
          );
        }),
        finalize(() => (this.loadingFleetVinculos = false))
      )
      .subscribe({
        next: (rows) => {
          const acc: Record<number, VehicleMaintenancePlanMatchDto | null> = {};
          rows.forEach((r) => {
            acc[r.id] = r.m;
          });
          this.fleetLinkageCache = acc;
        }
      });
  }

  private strictPositiveId(v: unknown): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v));
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null;
    return n;
  }

  private normNombre(s: unknown): string {
    return String(s ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  /** Intervalos comparables entre libro y catálogo. */
  private mismoIntervaloKmMeses(act: ActivityApiResponse, tpl: ActivityApiResponse): boolean {
    const kk = Number(act.intervaloKm ?? NaN);
    const kt = Number(tpl.intervaloKm ?? NaN);
    const mk = Number(act.intervaloMeses ?? NaN);
    const mt = Number(tpl.intervaloMeses ?? NaN);
    return (
      (Number.isFinite(kk) ? Math.trunc(kk) : 0) === (Number.isFinite(kt) ? Math.trunc(kt) : 0) &&
      (Number.isFinite(mk) ? Math.trunc(mk) : 0) === (Number.isFinite(mt) ? Math.trunc(mt) : 0)
    );
  }

  /** Igualdad nombre+intervalos entre libro y fila catálogo (sincronizada con servidor: mismo clon MMY ya incorporado). */
  private libroYaIncorporaLineaMmY(act: ActivityApiResponse, tpl: ActivityApiResponse): boolean {
    const cid = this.strictPositiveId(act.clonedFromPlanActivityId);
    const tid = this.strictPositiveId(tpl.id);
    if (cid != null && tid != null && cid === tid) {
      return true;
    }
    const nLibro = this.normNombre(act.nombre);
    const nTpl = this.normNombre(tpl.nombre);
    if (!nLibro || !nTpl || nLibro !== nTpl) return false;
    return this.mismoIntervaloKmMeses(act, tpl);
  }

  /** Líneas MMY del catálogo que aún no están en el libro visible de esta placa. */
  pendientesPlantillaParaPlaca(lg: VehicleMaintenancePlanMatchDto | null): ActivityApiResponse[] {
    const rid = lg?.resolvedPlanId;
    if (rid == null || rid <= 0) return [];
    const mode = (lg?.matchMode || '').toUpperCase();
    if (mode === 'NONE') return [];
    const cat = this.fleetCatalogByPlanId[rid];
    if (!cat?.length) return [];
    const libro = this.linkagePlanActiveActivities(lg);
    return cat.filter(
      (tpl) => libro.every((row) => !this.libroYaIncorporaLineaMmY(row, tpl))
    );
  }

  onAgregarDesdePlantillaSelect(
    vehicleId: number,
    lg: VehicleMaintenancePlanMatchDto,
    tplIdRaw: string,
    selectReset?: HTMLSelectElement | null
  ): void {
    const raw = String(tplIdRaw ?? '').trim();
    if (!raw) {
      if (selectReset) selectReset.value = '';
      return;
    }
    const tplId = this.strictPositiveId(raw);
    if (!tplId) {
      if (selectReset) selectReset.value = '';
      return;
    }
    const tpl = this.pendientesPlantillaParaPlaca(lg).find((p) => this.strictPositiveId(p.id) === tplId);
    if (!tpl) {
      if (selectReset) selectReset.value = '';
      return;
    }
    const tipoLinea = (tpl.tipo ?? '').trim();
    if (!tipoLinea) {
      alert('Esta línea del catálogo no tiene tipo definido — no se puede enviar al servidor.');
      if (selectReset) selectReset.value = '';
      return;
    }
    const req: ActivityApiRequest = {
      nombre: tpl.nombre,
      tipo: tipoLinea,
      intervaloKm: tpl.intervaloKm,
      intervaloMeses: tpl.intervaloMeses,
      cloneFromPlanActivityId: tpl.id
    };
    this.mpService.agregarActividadVehiculoApi(vehicleId, req).subscribe({
      next: () => {
        if (selectReset) selectReset.value = '';
        this.onPlanLinkageChangedFromChild();
      },
      error: (err: unknown) => {
        if (selectReset) selectReset.value = '';
        const e = err as { error?: { message?: string }; message?: string };
        const msg = e?.error?.message || e?.message || 'No se pudo incorporar esa línea a la placa.';
        alert(msg);
      }
    });
  }

  /** Refresca listado de vehículos y panel de placas vinculadas (después de vincular en MP). */
  onPlanLinkageChangedFromChild(): void {
    if (this.filterCategoria !== 'preventivo') {
      return;
    }
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.reloadVinculosPlacasFleet();
      }
    });
  }

  refrescarNavbar(): void {
    if (this.filterCategoria !== 'preventivo') {
      if (this.selectedVehicleId) {
        this.onVehicleChange(this.selectedVehicleId);
      }
      return;
    }
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.reloadVinculosPlacasFleet();
        if (this.selectedVehicleId != null) {
          this.onVehicleChange(this.selectedVehicleId, false);
        }
      }
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'DRAFT':
        return 'scheduled';
      case 'QUOTE':
        return 'scheduled';
      case 'COMPLETED':
        return 'completed';
      case 'IN_PROGRESS': return 'in-progress';
      case 'SCHEDULED': return 'scheduled';
      case 'CANCELLED': return 'cancelled';
      default: return '';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Borrador';
      case 'QUOTE':
        return 'Cotización';
      case 'COMPLETED':
        return 'Completado';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'SCHEDULED': return 'Programado';
      case 'CANCELLED': return 'Cancelado';
      default: return status || 'Desconocido';
    }
  }

  newMaintenance() {
    const queryParams: Record<string, string | number> = {};
    if (this.selectedVehicleId) {
      queryParams['vehicleId'] = this.selectedVehicleId;
    }
    if (this.filterCategoria) {
      queryParams['categoria'] = this.filterCategoria;
    }
    void this.router.navigate(['/maintenance/new'], {
      queryParams: Object.keys(queryParams).length ? queryParams : undefined
    });
  }

  deleteMaintenance(id: number) {
    if (confirm('¿Eliminar este mantenimiento?')) {
      this.maintenanceService.deleteMaintenance(id).subscribe({
        next: () => {
          if (this.selectedVehicleId) this.onVehicleChange(this.selectedVehicleId);
        }
      });
    }
  }

  abrirEdicionMantenimiento(m: MaintenanceResponse): void {
    const q: Record<string, string | number> = { vehicleId: m.vehicleId };
    if (this.filterCategoria === 'correctivo' || this.filterCategoria === 'preventivo') {
      q['categoria'] = this.filterCategoria;
    }
    void this.router.navigate(['/maintenance/edit', m.id], { queryParams: q });
  }
}
