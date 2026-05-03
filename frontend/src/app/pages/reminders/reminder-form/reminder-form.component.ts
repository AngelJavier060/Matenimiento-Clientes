import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';

@Component({
  selector: 'app-reminder-form',
  templateUrl: './reminder-form.component.html',
  styleUrls: ['./reminder-form.component.scss']
})
export class ReminderFormComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  submitting = false;
  error = '';

  formData = {
    vehicleId: null as number | null,
    title: '',
    description: '',
    reminderType: 'MILEAGE_BASED',
    thresholdMileage: null as number | null,
    thresholdDate: '',
    isRecurring: false,
    recurringInterval: null as number | null
  };

  reminderTypes = [
    { value: 'MILEAGE_BASED', label: 'Basado en km' },
    { value: 'DATE_BASED', label: 'Basado en fecha' },
    { value: 'BOTH', label: 'Ambos' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private reminderService: ReminderService
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe(data => {
      this.vehicles = data;
      const vehicleId = this.route.snapshot.queryParamMap.get('vehicleId');
      if (vehicleId) {
        this.formData.vehicleId = Number(vehicleId);
      }
    });
  }

  get showMileage(): boolean {
    return this.formData.reminderType === 'MILEAGE_BASED' || this.formData.reminderType === 'BOTH';
  }

  get showDate(): boolean {
    return this.formData.reminderType === 'DATE_BASED' || this.formData.reminderType === 'BOTH';
  }

  onSubmit() {
    if (!this.formData.vehicleId || !this.formData.title) {
      this.error = 'Vehículo y título son obligatorios';
      return;
    }

    this.submitting = true;
    this.error = '';

    const request: any = {
      vehicleId: this.formData.vehicleId,
      title: this.formData.title,
      description: this.formData.description || undefined,
      reminderType: this.formData.reminderType,
      thresholdMileage: this.showMileage ? (this.formData.thresholdMileage || undefined) : undefined,
      thresholdDate: this.showDate ? (this.formData.thresholdDate || undefined) : undefined,
      isRecurring: this.formData.isRecurring || undefined,
      recurringInterval: this.formData.isRecurring ? (this.formData.recurringInterval || undefined) : undefined
    };

    this.reminderService.createReminder(request).subscribe({
      next: () => {
        this.router.navigate(['/reminders'], { queryParams: { vehicleId: this.formData.vehicleId } });
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Error al guardar recordatorio';
      }
    });
  }

  goBack() {
    const params = this.formData.vehicleId ? { vehicleId: this.formData.vehicleId } : {};
    this.router.navigate(['/reminders'], { queryParams: params });
  }
}
