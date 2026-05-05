import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { ReminderResponse } from '../../../models/reminder/reminder-response';

/** Vista de lista de recordatorios: flota (vencidos/próximos) o por vehículo concreto. */
type RemindersView = 'fleet' | 'vehicle';

type ReminderVisualTone = 'overdue' | 'soon' | 'mileage' | 'scheduled';

@Component({
  selector: 'app-reminder-list',
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.scss']
})
export class ReminderListComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  /** Todos los recordatorios activos del usuario (sólo flota — estadísticas). */
  allActiveReminders: ReminderResponse[] = [];
  /** Recordatorios activos del vehículo seleccionado. */
  vehicleReminders: ReminderResponse[] = [];
  /** Recordatorios vencidos/próximos según API /reminders/due. */
  fleetDueReminders: ReminderResponse[] = [];
  selectedVehicleId: number | null = null;
  view: RemindersView = 'fleet';
  loading = false;
  fleetSearchTerm = '';

  constructor(
    private vehicleService: VehicleService,
    private reminderService: ReminderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe((data) => {
      this.vehicles = data;
      this.applyRouteVehicleId();
    });

    this.route.queryParamMap.subscribe(() => {
      if (this.vehicles.length > 0) {
        this.applyRouteVehicleId();
      }
    });
  }

  private applyRouteVehicleId(): void {
    const vidStr = this.route.snapshot.queryParamMap.get('vehicleId');

    if (vidStr) {
      const id = Number(vidStr);
      if (Number.isNaN(id)) {
        this.stripInvalidVehicleIdFromUrl();
        return;
      }
      if (!this.vehicles.some((v) => v.id === id)) {
        this.stripInvalidVehicleIdFromUrl();
        return;
      }
      this.view = 'vehicle';
      if (this.selectedVehicleId !== id) {
        this.selectedVehicleId = id;
        this.loadVehicleReminders(id);
      }
      return;
    }

    if (this.view === 'fleet') {
      this.selectedVehicleId = null;
      this.vehicleReminders = [];
      this.loadFleetDashboard();
    }
  }

  private stripInvalidVehicleIdFromUrl(): void {
    void this.router.navigate(['/reminders'], { replaceUrl: true });
    this.view = 'fleet';
    this.selectedVehicleId = null;
    this.loadFleetDashboard();
  }

  selectFleetTab(): void {
    this.view = 'fleet';
    this.selectedVehicleId = null;
    this.vehicleReminders = [];
    void this.router.navigate(['/reminders'], { replaceUrl: true });
    this.loadFleetDashboard();
  }

  selectVehicleTab(): void {
    this.view = 'vehicle';
    const vidStr = this.route.snapshot.queryParamMap.get('vehicleId');
    if (vidStr) {
      const id = Number(vidStr);
      if (!Number.isNaN(id) && this.vehicles.some((v) => v.id === id)) {
        this.selectedVehicleId = id;
        this.loadVehicleReminders(id);
        return;
      }
    }
    this.selectedVehicleId = null;
    this.vehicleReminders = [];
  }

  onVehicleSelectChange(): void {
    const id = this.selectedVehicleId;
    if (id == null) {
      this.vehicleReminders = [];
      void this.router.navigate(['/reminders'], { replaceUrl: true, queryParams: {} });
      return;
    }
    void this.router.navigate(['/reminders'], {
      replaceUrl: true,
      queryParams: { vehicleId: id }
    });
    this.loadVehicleReminders(id);
  }

  private loadVehicleReminders(vehicleId: number): void {
    this.loading = true;
    this.reminderService.getRemindersByVehicle(vehicleId).subscribe({
      next: (data) => {
        this.vehicleReminders = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  private loadFleetDashboard(): void {
    this.loading = true;
    forkJoin({
      due: this.reminderService.getDueReminders(),
      all: this.reminderService.getUserReminders()
    }).subscribe({
      next: ({ due, all }) => {
        this.fleetDueReminders = due;
        this.allActiveReminders = all ?? [];
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  refresh(): void {
    if (this.view === 'fleet') {
      this.loadFleetDashboard();
      return;
    }
    if (this.selectedVehicleId != null) {
      this.loadVehicleReminders(this.selectedVehicleId);
    }
  }

  goToVehicleFromFleetRow(vehicleId: number): void {
    this.view = 'vehicle';
    this.selectedVehicleId = vehicleId;
    void this.router.navigate(['/reminders'], {
      replaceUrl: true,
      queryParams: { vehicleId }
    });
    this.loadVehicleReminders(vehicleId);
  }

  deleteReminder(id: number): void {
    if (!confirm('¿Eliminar este recordatorio?')) {
      return;
    }
    this.reminderService.deleteReminder(id).subscribe({
      next: () => this.refresh()
    });
  }

  vehicleFor(id: number): VehicleResponse | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  get filteredFleetDue(): ReminderResponse[] {
    const q = this.fleetSearchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return this.fleetDueReminders;
    return this.fleetDueReminders.filter((r) => {
      const blob = `${r.title} ${r.description ?? ''} ${r.vehicleInfo ?? ''}`.toLowerCase();
      const v = this.vehicleFor(r.vehicleId);
      const plat = `${v?.licensePlate ?? ''} ${v?.brand ?? ''} ${v?.model ?? ''}`.toLowerCase();
      return blob.includes(q) || plat.includes(q);
    });
  }

  get filteredVehicleReminders(): ReminderResponse[] {
    const q = this.fleetSearchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return this.vehicleReminders;
    return this.vehicleReminders.filter((r) => {
      const blob = `${r.title} ${r.description ?? ''}`.toLowerCase();
      return blob.includes(q);
    });
  }

  reminderTypeEs(t?: string | null): string {
    switch ((t || '').toUpperCase()) {
      case 'MILEAGE_BASED':
        return 'Basado en kilometraje';
      case 'DATE_BASED':
        return 'Basado en fecha';
      case 'BOTH':
        return 'Fecha y kilometraje';
      default:
        return t?.replace(/_/g, ' ') || 'Sin tipo';
    }
  }

  formatDate(raw?: string | null): string {
    if (!raw) return '—';
    const d = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('es-EC', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(raw?: string | null): string {
    if (!raw) return '—';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString('es-EC', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  parseThresholdDay(raw?: string | null): Date | null {
    if (!raw) return null;
    const d = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private todayMidnight(): Date {
    const x = new Date();
    x.setHours(12, 0, 0, 0);
    return x;
  }

  isDatePartOverdue(thresholdIso?: string | null): boolean {
    const d = this.parseThresholdDay(thresholdIso);
    if (!d) return false;
    return d <= this.todayMidnight();
  }

  kmThresholdExceeded(r: ReminderResponse, v?: VehicleResponse): boolean {
    if (r.thresholdMileage == null || r.thresholdMileage < 0) return false;
    const m = v?.mileage;
    if (m == null || m < 0) return false;
    return m >= r.thresholdMileage;
  }

  /** Barra kilometraje: odómetro actual vs umbral recordatorio */
  mileageBarPercent(r: ReminderResponse, v?: VehicleResponse): number | null {
    const th = r.thresholdMileage;
    if (th == null || th <= 0) return null;
    const m = v?.mileage;
    if (m == null || m < 0) return null;
    return Math.min(100, Math.round((m / th) * 100));
  }

  visualToneFleet(r: ReminderResponse): ReminderVisualTone {
    const v = this.vehicleFor(r.vehicleId);
    if (this.isDatePartOverdue(r.thresholdDate) || this.kmThresholdExceeded(r, v)) {
      return 'overdue';
    }
    if (/MILEAGE/i.test(String(r.reminderType))) {
      return 'mileage';
    }
    return 'soon';
  }

  visualToneVehicle(r: ReminderResponse, v?: VehicleResponse): ReminderVisualTone {
    if (!r.isActive) return 'scheduled';
    const overdueDate = this.isDatePartOverdue(r.thresholdDate);
    const overdueKm = this.kmThresholdExceeded(r, v);
    if (overdueDate || overdueKm) return 'overdue';
    const d = this.parseThresholdDay(r.thresholdDate);
    const in7 = () => {
      if (!d) return false;
      const diff = Math.round((d.getTime() - this.todayMidnight().getTime()) / 86400000);
      return diff >= 0 && diff <= 7;
    };
    if (in7()) return 'soon';
    if (/MILEAGE/i.test(String(r.reminderType)) || r.thresholdMileage != null) return 'mileage';
    return 'scheduled';
  }

  badgeToneLabel(tone: ReminderVisualTone): string {
    switch (tone) {
      case 'overdue':
        return 'Atención / vencido';
      case 'soon':
        return 'Próximo';
      case 'mileage':
        return 'Km';
      default:
        return 'Planificado';
    }
  }

  urgentFleetCount(): number {
    return this.fleetDueReminders.filter((r) => this.visualToneFleet(r) === 'overdue').length;
  }

  upcoming30Count(): number {
    const today = this.todayMidnight();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 31);
    return this.allActiveReminders.filter((r) => {
      const d = this.parseThresholdDay(r.thresholdDate);
      if (!d || d <= today) return false;
      return d < limit;
    }).length;
  }

  fleetHealthScore(): number {
    const n = this.vehicles.length;
    if (n <= 0) return 100;
    const dup = Math.min(95, Math.round((this.fleetDueReminders.length / Math.max(n, 1)) * 22));
    return Math.max(42, Math.min(98, 100 - dup));
  }

  recurrenceLabel(r: ReminderResponse): string | null {
    if (!r.isRecurring) return null;
    const days = r.recurringInterval ?? 0;
    if (days <= 0) return 'Recurrente';
    return `Cada ${days} día${days === 1 ? '' : 's'}`;
  }
}
