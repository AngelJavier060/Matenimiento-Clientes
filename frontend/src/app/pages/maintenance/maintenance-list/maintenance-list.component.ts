import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { MaintenanceResponse } from '../../../models/maintenance/maintenance-response';

@Component({
  selector: 'app-maintenance-list',
  templateUrl: './maintenance-list.component.html',
  styleUrls: ['./maintenance-list.component.scss']
})
export class MaintenanceListComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  maintenances: MaintenanceResponse[] = [];
  selectedVehicleId: number | null = null;
  loading = false;
  /** Filtro desde el menú lateral: correctivo | preventivo */
  filterCategoria: 'correctivo' | 'preventivo' | null = null;

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe((data) => {
      this.vehicles = data;
      this.applyRouteParams();
    });

    this.route.queryParamMap.subscribe(() => this.applyRouteParams());
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
    return this.maintenances.filter((m) => this.matchesCategoria(m.serviceType, cat));
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

  /** Filtros cruzados: «correctivo» en URL lista lo que coincide con texto preventivo, y viceversa. */
  private matchesCategoria(serviceType: string | undefined, cat: 'correctivo' | 'preventivo'): boolean {
    const t = (serviceType ?? '').trim().toLowerCase();
    if (!t) {
      return false;
    }
    if (cat === 'correctivo') {
      return (
        t.includes('prevent') ||
        t === 'preventivo' ||
        t.includes('mantenimiento preventivo')
      );
    }
    return (
      t.includes('correct') ||
      t === 'correctivo' ||
      t.includes('mantenimiento correctivo')
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
      error: () => this.loading = false
    });
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'IN_PROGRESS': return 'in-progress';
      case 'SCHEDULED': return 'scheduled';
      case 'CANCELLED': return 'cancelled';
      default: return '';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'COMPLETED': return 'Completado';
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
}
