import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';

type FleetFuelFilter = '' | NonNullable<VehicleResponse['fuelType']>;
type FleetStateFilter = '' | 'OPERATIVO' | 'MANTENIMIENTO' | 'INACTIVO';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss']
})
export class VehicleListComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  loading = true;
  searchTerm = '';
  /** Filtros (mismo patrón que registro cliente / ingeniería) */
  filterBrand = '';
  filterFleetState: FleetStateFilter = '';
  filterFuel: FleetFuelFilter = '';

  readonly defaultAvatarUrl =
    'https://lh3.googleusercontent.com/aida/ADBb0ujt5ZBz6Ft-x2I73c9KM4VRXEEGtQMMoCWqFLtrJIFJpZp7MqQVRAh7znFVkmrDv474XUdyEV9zo0z4HH71EYLo1jZmAg40EorsSTfCkHCkiWD_yR8xopEMisHwTVyxaENyBd9Fyo30xSpU0GHtsBmPFWZ9r2NdwnHw98N8YcNFwPUhQMXO8Dpwb6Giv3BMvHDlBcKJtcWHIcnk8wF1bxCJwgVSOMpoDDy_Ko4c36TC5a948Gq4hc86a-T1mox4OMFtuEp_rRI';

  /** Resuelve URLs de imágenes contra el backend */
  backendImage(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = environment.apiUrl.replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  readonly showcaseImages = [
    'https://lh3.googleusercontent.com/aida/ADBb0uhEINwbbidQ6jdpxLJahC9qmAb2rGtnNq5pirzQc2n6hnPiry4FP4zhpplJqSyg8AeGItZQx_asyZnSda7xbtjgjo2xCBVyuG3VuWHBwFwrf_iECuussEKJHCYeA9Q2v0MRLWhE1hJoWFFeXimflN-ctmMEsq6lRwGdphKhfE_iciPgHqpV9OdGrhSQWr1OP58PG0WXBZYlJUEOFmcD6knhXpl5xsxicllY8EoJwKYT3PjOYsnEEze2hCeOi53c8ss7dQPZ1suk',
    'https://lh3.googleusercontent.com/aida/ADBb0uiJgmZ1RQek6Qh8mskeDcAANP1kXjgpMGTK3d7O3gB0M4Qae9Z7gzWwkUt0TqMi51PynX3e20PRoxiPMANTO17YQmGFY7fs7st7hADvIsq0W_QLR0cim5-kFZxHX_AW-ahKbv-nijkUiSCkmtPGcPvaRNYKewjGNxL_f8ZpjXA3e7jgB-u8YxmyFU8sobvRnVzUOg9NrtdCHeEP28ZiOZ-7OAnyGGjoDIAs8MpurhNE-r2LJmg8zw1kNao22eexWixcF3-AwZcF',
    'https://lh3.googleusercontent.com/aida/ADBb0uhjwRqTSNxywWSnQF7X0Sbx8ogV4fw3O6z3N-GvIDw2Uy6pADbPB8Ki2iMRp8xpEO7lLaz58HG4xcJSHJYZ7AHyZ0Dsim49hUM9JfPod0o76vOaPqbP2VL1cnw9jRzVo3HBrZpjnqQh5kdPKC2dDVS5Rt45xQIewJZGMgtiYZQNbDiOtKXLagzberns1VK9war-Ujrf-V0yuJ8aoc90hPh9eyuO82qQOIkeuScPwYdaJFs9a9qhOwcg2pwlm3MXZraJ3zSc9ben',
    'https://lh3.googleusercontent.com/aida/ADBb0ugqh6YJ-rphe37butrlzf90edDtUR6t2Lky2hOdcJhaDqjJKk0JNgM9Skc9TFVjPSXqwqkv0gZa8dWDeg6sWRVrlegHnK_4FBcvJqJe1kjkbJjufWWvyND_hRsYhBUU-5K-UzjNCJdwYAHDVpGEsmbqd700ix9DldLwnTV-dQep270m0CS8-E-yAcG-A5wfthpt66ILxz4rSqNELTLAiGgV1NuovPEUV9J56KTkrQqRNJHDo1YPgwulAVkIYMyHP8ffHQZ7dAdr'
  ];

  constructor(
    private vehicleService: VehicleService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVehicles();
  }

  get ownerDisplayName(): string {
    return this.authService.getCurrentUser()?.fullName?.trim() || 'Titular de cuenta';
  }

  get headerAvatarUrl(): string {
    return this.authService.getCurrentUser()?.avatarUrl || this.defaultAvatarUrl;
  }

  get brandOptions(): string[] {
    const set = new Set(this.vehicles.map((v) => v.brand).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  get kpiTotal(): number {
    return this.vehicles.length;
  }

  get kpiOperativos(): number {
    return this.vehicles.filter((v) => this.fleetStateKey(v) === 'OPERATIVO').length;
  }

  get kpiEnMantenimiento(): number {
    return this.vehicles.filter((v) => this.fleetStateKey(v) === 'MANTENIMIENTO').length;
  }

  get kpiInactivos(): number {
    return this.vehicles.filter((v) => this.fleetStateKey(v) === 'INACTIVO').length;
  }

  get kpiRegistrosMantenimiento(): number {
    return this.vehicles.reduce((acc, v) => acc + (v.maintenanceCount || 0), 0);
  }

  get kpiMarcas(): number {
    return new Set(this.vehicles.map((v) => v.brand).filter(Boolean)).size;
  }

  loadVehicles() {
    this.loading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  /** Estado de flota coherente con datos reales (API no trae “alerta” aún). */
  fleetStateKey(v: VehicleResponse): 'OPERATIVO' | 'MANTENIMIENTO' | 'INACTIVO' {
    if (!v.isActive) {
      return 'INACTIVO';
    }
    if (v.maintenanceCount > 0) {
      return 'MANTENIMIENTO';
    }
    return 'OPERATIVO';
  }

  fleetStateLabel(v: VehicleResponse): string {
    const m: Record<string, string> = {
      OPERATIVO: 'Operativo',
      MANTENIMIENTO: 'En mantenimiento',
      INACTIVO: 'Inactivo'
    };
    return m[this.fleetStateKey(v)];
  }

  fleetStateClass(v: VehicleResponse): string {
    const k = this.fleetStateKey(v);
    if (k === 'OPERATIVO') {
      return 'vl-badge vl-badge--ok';
    }
    if (k === 'MANTENIMIENTO') {
      return 'vl-badge vl-badge--warn';
    }
    return 'vl-badge vl-badge--off';
  }

  cardImage(i: number): string {
    return this.showcaseImages[i % this.showcaseImages.length];
  }

  refLabel(id: number): string {
    return `IS-${String(id).padStart(4, '0')}`;
  }

  formatKm(v: VehicleResponse): string {
    const m = v.mileage ?? 0;
    return m.toLocaleString('es') + ' km';
  }

  vinShort(v: VehicleResponse): string {
    const s = (v.vin || '').trim();
    if (!s) {
      return '—';
    }
    return s.length > 11 ? s.slice(0, 11) : s;
  }

  lastServiceLabel(_v: VehicleResponse): string {
    return 'N/A';
  }

  fuelLabel(ft?: string | null): string {
    if (!ft) {
      return '—';
    }
    const map: Record<string, string> = {
      GASOLINE: 'Gasolina',
      DIESEL: 'Diesel',
      ELECTRIC: 'Eléctrico',
      HYBRID: 'Híbrido',
      LPG: 'GLP',
      CNG: 'GNC'
    };
    return map[ft] || ft;
  }

  get filteredVehicles(): VehicleResponse[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.vehicles.filter((v) => {
      const matchSearch =
        !q ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.licensePlate?.toLowerCase().includes(q) ?? false) ||
        (v.vin?.toLowerCase().includes(q) ?? false);

      const matchBrand = !this.filterBrand || v.brand === this.filterBrand;
      const matchFuel = !this.filterFuel || v.fuelType === this.filterFuel;
      const k = this.fleetStateKey(v);
      const matchState = !this.filterFleetState || k === this.filterFleetState;

      return matchSearch && matchBrand && matchFuel && matchState;
    });
  }

  applyFilters(): void {
    this.loadVehicles();
  }

  viewDetail(id: number) {
    this.router.navigate(['/vehicles', id]);
  }

  editVehicle(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/vehicles/edit', id]);
  }

  deleteVehicle(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => this.loadVehicles()
      });
    }
  }

  history(id: number, event?: Event) {
    event?.stopPropagation();
    void this.router.navigate(['/maintenance'], {
      queryParams: { vehicleId: id }
    });
  }

  newVehicle() {
    this.router.navigate(['/vehicles/new']);
  }
}
