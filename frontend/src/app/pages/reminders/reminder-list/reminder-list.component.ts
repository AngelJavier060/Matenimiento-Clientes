import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { ReminderResponse } from '../../../models/reminder/reminder-response';

@Component({
  selector: 'app-reminder-list',
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.scss']
})
export class ReminderListComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  reminders: ReminderResponse[] = [];
  selectedVehicleId: number | null = null;
  loading = false;

  constructor(
    private vehicleService: VehicleService,
    private reminderService: ReminderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe(data => this.vehicles = data);
  }

  onVehicleChange(vehicleId: number) {
    this.selectedVehicleId = vehicleId;
    this.loading = true;
    this.reminderService.getRemindersByVehicle(vehicleId).subscribe({
      next: (data) => {
        this.reminders = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  newReminder() {
    const queryParams = this.selectedVehicleId ? { vehicleId: this.selectedVehicleId } : {};
    this.router.navigate(['/reminders/new'], { queryParams });
  }

  deleteReminder(id: number) {
    if (confirm('¿Eliminar este recordatorio?')) {
      this.reminderService.deleteReminder(id).subscribe({
        next: () => {
          if (this.selectedVehicleId) this.onVehicleChange(this.selectedVehicleId);
        }
      });
    }
  }
}
