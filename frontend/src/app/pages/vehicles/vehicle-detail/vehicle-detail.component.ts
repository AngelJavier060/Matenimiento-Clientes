import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { MaintenanceResponse } from '../../../models/maintenance/maintenance-response';
import { ReminderResponse } from '../../../models/reminder/reminder-response';

@Component({
  selector: 'app-vehicle-detail',
  templateUrl: './vehicle-detail.component.html',
  styleUrls: ['./vehicle-detail.component.scss']
})
export class VehicleDetailComponent implements OnInit {
  vehicle: VehicleResponse | null = null;
  maintenances: MaintenanceResponse[] = [];
  reminders: ReminderResponse[] = [];
  loading = true;
  activeTab: 'info' | 'maintenance' | 'reminders' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private reminderService: ReminderService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadVehicle(id);
    }
  }

  loadVehicle(id: number) {
    this.loading = true;
    this.vehicleService.getVehicleById(id).subscribe({
      next: (data) => {
        this.vehicle = data;
        this.loading = false;
        this.loadMaintenances(id);
        this.loadReminders(id);
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/vehicles']);
      }
    });
  }

  loadMaintenances(vehicleId: number) {
    this.maintenanceService.getMaintenancesByVehicle(vehicleId).subscribe({
      next: (data) => this.maintenances = data
    });
  }

  loadReminders(vehicleId: number) {
    this.reminderService.getRemindersByVehicle(vehicleId).subscribe({
      next: (data) => this.reminders = data
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

  goBack() {
    this.router.navigate(['/vehicles']);
  }

  editVehicle() {
    this.router.navigate(['/vehicles/edit', this.vehicle?.id]);
  }

  deleteVehicle() {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      this.vehicleService.deleteVehicle(this.vehicle!.id).subscribe({
        next: () => this.router.navigate(['/vehicles'])
      });
    }
  }
}
