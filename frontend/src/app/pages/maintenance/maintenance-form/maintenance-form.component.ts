import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';

@Component({
  selector: 'app-maintenance-form',
  templateUrl: './maintenance-form.component.html',
  styleUrls: ['./maintenance-form.component.scss']
})
export class MaintenanceFormComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  submitting = false;
  error = '';

  formData = {
    vehicleId: null as number | null,
    serviceType: '',
    description: '',
    mileageAtService: null as number | null,
    cost: null as number | null,
    serviceDate: '',
    nextServiceMileage: null as number | null,
    nextServiceDate: '',
    workshopName: '',
    workshopAddress: '',
    status: 'SCHEDULED',
    notes: ''
  };

  statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private maintenanceService: MaintenanceService
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe((data) => {
      this.vehicles = data;
      const qp = this.route.snapshot.queryParamMap;
      const vehicleId = qp.get('vehicleId');
      if (vehicleId) {
        this.formData.vehicleId = Number(vehicleId);
      }
      const cat = qp.get('categoria');
      if (!this.formData.serviceType.trim()) {
        // En menú «Correctivo» se usa la plantilla que antes era preventiva.
        if (cat === 'correctivo') {
          this.formData.serviceType = 'Mantenimiento preventivo';
        } else if (cat === 'preventivo') {
          this.formData.serviceType = 'Mantenimiento correctivo';
        }
      }
    });
  }

  onSubmit() {
    if (!this.formData.vehicleId || !this.formData.serviceType) {
      this.error = 'Vehículo y tipo de servicio son obligatorios';
      return;
    }

    this.submitting = true;
    this.error = '';

    const request: any = {
      vehicleId: this.formData.vehicleId,
      serviceType: this.formData.serviceType,
      description: this.formData.description || undefined,
      mileageAtService: this.formData.mileageAtService || undefined,
      cost: this.formData.cost || undefined,
      serviceDate: this.formData.serviceDate || undefined,
      nextServiceMileage: this.formData.nextServiceMileage || undefined,
      nextServiceDate: this.formData.nextServiceDate || undefined,
      workshopName: this.formData.workshopName || undefined,
      workshopAddress: this.formData.workshopAddress || undefined,
      status: this.formData.status || undefined,
      notes: this.formData.notes || undefined
    };

    this.maintenanceService.createMaintenance(request).subscribe({
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
        this.error = err.error?.message || 'Error al guardar mantenimiento';
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
