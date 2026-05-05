import { Component, Input } from '@angular/core';
import { MaintenanceResponse } from '../../../models/maintenance/maintenance-response';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';

export interface HistoryReportNextService {
  label: string;
  km?: number | null;
}

@Component({
  selector: 'app-maintenance-history-report',
  templateUrl: './maintenance-history-report.component.html',
  styleUrls: ['./maintenance-history-report.component.scss']
})
export class MaintenanceHistoryReportComponent {
  @Input({ required: true }) vehicle!: VehicleResponse;
  @Input({ required: true }) maintenances: MaintenanceResponse[] = [];
  @Input({ required: true }) nextServices: HistoryReportNextService[] = [];

  readonly reportBrandTitle = 'Mantenimiento Vehícular';

  /** ID legible corto para el encabezado */
  @Input() reportId = '';

  @Input() generatedLabel = '';

  get sortedMaintenances(): MaintenanceResponse[] {
    return [...this.maintenances].sort((a, b) => this.ts(b.serviceDate) - this.ts(a.serviceDate));
  }

  totalCost(): number {
    return this.maintenances.reduce((s, m) => s + (m.cost ?? 0), 0);
  }

  totalCostFormatted(): string {
    return this.costLabel(this.totalCost());
  }

  detailCards(): { title: string; dateShort: string; kmLabel: string }[] {
    return this.sortedMaintenances.slice(0, 3).map((m) => ({
      title: this.primaryActivityTitle(m),
      dateShort: this.formatDateLong(m.serviceDate),
      kmLabel: m.mileageAtService != null ? `En ${this.fmtKm(m.mileageAtService)} km` : '—'
    }));
  }

  activitiesForMaintenance(m: MaintenanceResponse): string[] {
    const performed =
      m.lineItems?.filter(
        (li) => String(li.lineType).toUpperCase() === 'PERFORMED' && (li.description?.trim() ?? '')
      ) ?? [];
    if (performed.length) {
      return performed.map((li) => li.description!.trim());
    }
    const desc = m.description?.trim();
    if (desc) {
      return desc.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    return [this.serviceCategoryLabel(m) || 'Mantenimiento'];
  }

  serviceCategoryLabel(m: MaintenanceResponse): string {
    const c = (m.serviceCategory ?? '').toUpperCase();
    if (c === 'PREVENTIVE') return 'Preventivo';
    if (c === 'CORRECTIVE') return 'Correctivo';
    return m.serviceType || '';
  }

  isPreventive(m: MaintenanceResponse): boolean {
    return (m.serviceCategory ?? '').toUpperCase() === 'PREVENTIVE';
  }

  formatDateIso(d?: string | null): string {
    if (!d) return '—';
    const x = d.includes('T') ? d.slice(0, 10) : d;
    return x;
  }

  costLabel(cost?: number | null): string {
    if (cost == null) return '—';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cost);
  }

  fmtKm(n: number): string {
    return new Intl.NumberFormat('es-ES').format(Math.round(n)) + ' km';
  }

  overallStatus(): { ok: boolean; label: string } {
    const ok = this.vehicle?.isActive !== false;
    return { ok, label: ok ? 'Operativo' : 'Inactivo' };
  }

  private primaryActivityTitle(m: MaintenanceResponse): string {
    const acts = this.activitiesForMaintenance(m);
    return acts[0] ?? this.serviceCategoryLabel(m);
  }

  private formatDateLong(d?: string | null): string {
    if (!d) return '—';
    try {
      const iso = d.includes('T') ? d : `${d}T12:00:00`;
      return new Intl.DateTimeFormat('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(iso));
    } catch {
      return this.formatDateIso(d);
    }
  }

  private ts(d?: string | null): number {
    if (!d) return 0;
    const t = new Date(d.includes('T') ? d : `${d}T12:00:00`).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
}
