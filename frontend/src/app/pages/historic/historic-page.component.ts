import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { VehicleService } from '../../core/services/vehicle.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { ReminderService } from '../../core/services/reminder.service';
import { VehicleResponse } from '../../models/vehicle/vehicle-response';
import { MaintenanceResponse } from '../../models/maintenance/maintenance-response';
import { ReminderResponse } from '../../models/reminder/reminder-response';
import {
  HistoryReportNextService,
  MaintenanceHistoryReportComponent
} from './maintenance-history-report/maintenance-history-report.component';

@Component({
  selector: 'app-historic-page',
  templateUrl: './historic-page.component.html',
  styleUrls: ['./historic-page.component.scss']
})
export class HistoricPageComponent implements OnInit {
  @ViewChild('pdfMount') pdfMount?: ElementRef<HTMLElement>;

  vehicles: VehicleResponse[] = [];
  loadingList = true;
  errorList: string | null = null;

  filterPlate = '';

  /** Montaje off-screen para html2canvas */
  pdfContext:
    | {
        vehicle: VehicleResponse;
        maintenances: MaintenanceResponse[];
        nextServices: HistoryReportNextService[];
        reportId: string;
        generatedLabel: string;
      }
    | null = null;

  pdfLoadingVehicleId: number | null = null;

  constructor(
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private reminderService: ReminderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (v) => {
        this.vehicles = (v ?? []).sort((a, b) =>
          (a.licensePlate ?? '').localeCompare(b.licensePlate ?? '', 'es', {
            sensitivity: 'base'
          })
        );
        this.loadingList = false;
        this.errorList = null;
      },
      error: () => {
        this.loadingList = false;
        this.errorList = 'No se pudo cargar el listado de vehículos.';
      }
    });
  }

  get filteredVehicles(): VehicleResponse[] {
    const q = this.filterPlate.trim().toLowerCase();
    if (!q) return this.vehicles;
    return this.vehicles.filter((v) => (v.licensePlate ?? '').toLowerCase().includes(q));
  }

  downloadHistoryPdf(vehicle: VehicleResponse): void {
    if (this.pdfLoadingVehicleId != null) return;
    this.pdfLoadingVehicleId = vehicle.id;
    this.cdr.detectChanges();

    forkJoin({
      maintenances: this.maintenanceService.getMaintenancesByVehicle(vehicle.id),
      reminders: this.reminderService.getRemindersByVehicle(vehicle.id)
    }).subscribe({
      next: async ({ maintenances, reminders }) => {
        const nextServices = this.buildNextServices(vehicle, reminders);
        const reportId = `#MHR-${vehicle.id}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
        const generatedLabel = new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'long',
          timeStyle: 'short'
        }).format(new Date());

        this.pdfContext = {
          vehicle,
          maintenances: maintenances ?? [],
          nextServices,
          reportId,
          generatedLabel
        };
        this.cdr.detectChanges();

        await this.waitPaint();

        const el = this.pdfMount?.nativeElement;
        try {
          if (!el) throw new Error('Sin contenedor PDF');
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdfW = 210;
          const pageH = 297;
          const imgH = (canvas.height * pdfW) / canvas.width;
          const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
          let heightLeft = imgH;
          let position = 0;
          pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
          heightLeft -= pageH;
          while (heightLeft > 0) {
            position = heightLeft - imgH;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
            heightLeft -= pageH;
          }
          const plate = (vehicle.licensePlate ?? 'unidad').replace(/[^\w-]+/g, '_');
          pdf.save(`historico_${plate}_${vehicle.id}.pdf`);
        } catch (e) {
          console.error(e);
          alert('No se pudo generar el PDF. Probá de nuevo o usá otro navegador.');
        } finally {
          this.pdfContext = null;
          this.pdfLoadingVehicleId = null;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.pdfLoadingVehicleId = null;
        this.cdr.detectChanges();
        alert('No se pudo cargar el historial para generar el PDF.');
      }
    });
  }

  private buildNextServices(
    vehicle: VehicleResponse,
    reminders: ReminderResponse[]
  ): HistoryReportNextService[] {
    const out: HistoryReportNextService[] = [];
    if (vehicle.nextCommittedServiceMileage != null && vehicle.nextCommittedServiceMileage > 0) {
      out.push({
        label: 'Próximo servicio comprometido',
        km: vehicle.nextCommittedServiceMileage
      });
    }
    const active = (reminders ?? [])
      .filter((r) => r.isActive !== false && r.thresholdMileage != null && r.thresholdMileage > 0)
      .sort((a, b) => (a.thresholdMileage ?? 0) - (b.thresholdMileage ?? 0));
    for (const r of active) {
      const km = r.thresholdMileage;
      const label = (r.title ?? 'Recordatorio').trim() || 'Recordatorio';
      if (out.some((o) => o.km === km && o.label === label)) continue;
      out.push({ label, km });
      if (out.length >= 6) break;
    }
    return out.slice(0, 3);
  }

  private waitPaint(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => resolve(), 200);
        });
      });
    });
  }
}
