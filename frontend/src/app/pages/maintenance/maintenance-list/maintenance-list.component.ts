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

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe(data => {
      this.vehicles = data;
      const vehicleId = this.route.snapshot.queryParamMap.get('vehicleId');
      if (vehicleId) {
        this.selectedVehicleId = Number(vehicleId);
        this.onVehicleChange(Number(vehicleId));
      }
    });
  }

  onVehicleChange(vehicleId: number | null) {
    this.selectedVehicleId = vehicleId;
    if (!vehicleId) return;
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
    const queryParams = this.selectedVehicleId ? { vehicleId: this.selectedVehicleId } : {};
    this.router.navigate(['/maintenance/new'], { queryParams });
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
