import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { ReminderService } from '../../core/services/reminder.service';
import { VehicleResponse } from '../../models/vehicle/vehicle-response';
import { MaintenanceResponse } from '../../models/maintenance/maintenance-response';
import { ReminderResponse } from '../../models/reminder/reminder-response';

const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export interface DashboardChartBar {
  label: string;
  count: number;
  heightPct: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: any;
  vehicles: VehicleResponse[] = [];
  maintenances: MaintenanceResponse[] = [];
  reminders: ReminderResponse[] = [];
  dueReminders: ReminderResponse[] = [];
  loading = true;
  chartMonths = 6;
  chartBars: DashboardChartBar[] = [];

  constructor(
    private authService: AuthService,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private reminderService: ReminderService,
    private router: Router
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    forkJoin({
      vehicles: this.vehicleService.getVehicles().pipe(catchError(() => of([] as VehicleResponse[]))),
      maintenances: this.maintenanceService.getAllMaintenances().pipe(
        catchError(() => of([] as MaintenanceResponse[]))
      ),
      reminders: this.reminderService.getUserReminders().pipe(catchError(() => of([] as ReminderResponse[]))),
      due: this.reminderService.getDueReminders().pipe(catchError(() => of([] as ReminderResponse[])))
    }).subscribe({
      next: ({ vehicles, maintenances, reminders, due }) => {
        this.vehicles = vehicles ?? [];
        this.maintenances = maintenances ?? [];
        this.reminders = reminders ?? [];
        this.dueReminders = due ?? [];
        this.rebuildChart();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onChartRangeChange() {
    this.rebuildChart();
  }

  private rebuildChart() {
    const n = this.chartMonths;
    const now = new Date();
    const buckets: { key: string; label: string; count: number }[] = [];

    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label:
          n === 12
            ? `${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
            : MONTH_LABELS[d.getMonth()],
        count: 0
      });
    }

    for (const m of this.maintenances) {
      const raw = m.serviceDate || m.createdAt;
      if (!raw) {
        continue;
      }
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) {
        continue;
      }
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (b) {
        b.count += 1;
      }
    }

    const max = Math.max(1, ...buckets.map((b) => b.count));
    this.chartBars = buckets.map((b) => ({
      label: b.label,
      count: b.count,
      heightPct: b.count === 0 ? 0 : Math.max(14, Math.round((b.count / max) * 100))
    }));
  }

  get activeVehicles(): number {
    return this.vehicles.filter((v) => v.isActive).length;
  }

  /** Mantenimientos en programación o en curso (equiv. “en taller”) */
  get inWorkshopCount(): number {
    return this.maintenances.filter((m) => {
      const s = (m.status || '').toString().toUpperCase();
      return s === 'IN_PROGRESS' || s === 'SCHEDULED';
    }).length;
  }

  get alertsCount(): number {
    return this.dueReminders.length;
  }

  get completedMaintenanceCount(): number {
    return this.maintenances.filter((m) => (m.status || '').toString().toUpperCase() === 'COMPLETED')
      .length;
  }

  /** 0–100: % de mantenimientos completados respecto al total registrado */
  get efficiencyGauge(): number {
    const t = this.maintenances.length;
    if (t === 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.completedMaintenanceCount / t) * 100));
  }

  /** 0–100: proporción de vehículos activos */
  get healthGauge(): number {
    const t = this.vehicles.length;
    if (t === 0) {
      return 100;
    }
    return Math.min(100, Math.round((this.activeVehicles / t) * 100));
  }

  /** 0–100: mezcla uso de flota vs carga de pendientes */
  get performanceGauge(): number {
    const totalR = this.reminders.filter((r) => r.isActive).length;
    const due = this.dueReminders.length;
    const pen = totalR > 0 ? Math.min(100, Math.round((due / Math.max(totalR, 1)) * 100)) : 0;
    return Math.max(0, Math.min(100, Math.round((this.healthGauge + this.efficiencyGauge) / 2 - pen * 0.25)));
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  exportReport() {
    if (this.vehicles.length === 0) {
      return;
    }
    const headers = ['Marca', 'Modelo', 'Año', 'Placa', 'Kilometraje', 'Activo', 'Mantenimientos'];
    const escape = (val: string | number | boolean) => {
      const s = String(val);
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const rows = this.vehicles.map((v) =>
      [
        v.brand,
        v.model,
        v.year,
        v.licensePlate ?? '',
        v.mileage ?? 0,
        v.isActive ? 'Sí' : 'No',
        v.maintenanceCount ?? 0
      ].map(escape).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flota-improvement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  vehicleFuelLabel(v: VehicleResponse): string {
    if (!v.fuelType) {
      return '—';
    }
    return v.fuelType.replace(/_/g, ' ');
  }

  vehicleTransmissionLabel(v: VehicleResponse): string {
    if (!v.transmission) {
      return '';
    }
    return v.transmission.replace(/_/g, ' ');
  }

  mileageLabel(km?: number): string {
    if (km == null) {
      return '—';
    }
    return `${km.toLocaleString('es')} km`;
  }
}
