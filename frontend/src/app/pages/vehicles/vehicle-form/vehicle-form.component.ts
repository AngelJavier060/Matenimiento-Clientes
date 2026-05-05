import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MantenimientoService } from '../../../services/mantenimiento.service';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.scss']
})
export class VehicleFormComponent implements OnInit {
  isEditing = false;
  vehicleId?: number;
  loading = false;
  submitting = false;
  error = '';
  maintenancePlans: { id: number; label: string }[] = [];

  formData = {
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    mileage: null as number | null,
    fuelType: '',
    transmission: '',
    color: '',
    notes: '',
    /** null = automático por marca/modelo/año (sin plan fijo). */
    maintenancePlanId: null as number | null,
    /** Próximo mantenimiento acordado (único por unidad): odómetro y/o día. */
    nextCommittedServiceMileage: null as number | null,
    nextCommittedServiceDate: '' as string
  };

  fuelTypes = ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG', 'CNG'];
  transmissionTypes = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private mpService: MantenimientoService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.vehicleId = Number(id);
      this.loadVehicle(this.vehicleId);
    }
    this.loadMaintenancePlans();
  }

  private loadMaintenancePlans(): void {
    this.mpService.obtenerTodosLosPlanesApi().subscribe({
      next: (plans) => {
        this.maintenancePlans = (plans || [])
          .filter((p) => p.isActive !== false)
          .map((p) => ({
            id: p.id,
            label: `${p.marca} ${p.modelo} (${p.anio}${p.motor ? ' · ' + p.motor : ''})`
          }));
      },
      error: () => {
        this.maintenancePlans = [];
      }
    });
  }

  loadVehicle(id: number) {
    this.loading = true;
    this.vehicleService.getVehicleById(id).subscribe({
      next: (v) => {
        this.formData = {
          brand: v.brand,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate || '',
          vin: v.vin || '',
          mileage: v.mileage || null,
          fuelType: v.fuelType || '',
          transmission: v.transmission || '',
          color: v.color || '',
          notes: v.notes || '',
          maintenancePlanId: v.maintenancePlanId ?? null,
          nextCommittedServiceMileage:
            v.nextCommittedServiceMileage != null ? v.nextCommittedServiceMileage : null,
          nextCommittedServiceDate: v.nextCommittedServiceDate ?? ''
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/vehicles']);
      }
    });
  }

  onSubmit() {
    if (!this.formData.brand || !this.formData.model || !this.formData.year) {
      this.error = 'Marca, modelo y año son obligatorios';
      return;
    }

    this.submitting = true;
    this.error = '';

    const request = {
      brand: this.formData.brand,
      model: this.formData.model,
      year: this.formData.year,
      licensePlate: this.formData.licensePlate || undefined,
      vin: this.formData.vin || undefined,
      mileage: this.formData.mileage || undefined,
      fuelType: this.formData.fuelType || undefined,
      transmission: this.formData.transmission || undefined,
      color: this.formData.color || undefined,
      notes: this.formData.notes || undefined,
      maintenancePlanId: this.formData.maintenancePlanId,
      nextCommittedServiceMileage: this.formData.nextCommittedServiceMileage,
      nextCommittedServiceDate: this.formData.nextCommittedServiceDate?.trim()
        ? this.formData.nextCommittedServiceDate.trim()
        : null
    };

    const action = this.isEditing
      ? this.vehicleService.updateVehicle(this.vehicleId!, request)
      : this.vehicleService.createVehicle(request);

    action.subscribe({
      next: () => {
        this.router.navigate(['/vehicles']);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Error al guardar vehículo';
      }
    });
  }

  goBack() {
    this.router.navigate(['/vehicles']);
  }
}
