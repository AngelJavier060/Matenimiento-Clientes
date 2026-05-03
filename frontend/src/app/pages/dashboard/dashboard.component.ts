import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { VehicleResponse } from '../../models/vehicle/vehicle-response';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: any;
  vehicles: VehicleResponse[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private vehicleService: VehicleService,
    private router: Router
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.loading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get totalMaintenances(): number {
    return this.vehicles.reduce((sum, v) => sum + (v.maintenanceCount || 0), 0);
  }

  get activeVehicles(): number {
    return this.vehicles.filter(v => v.isActive).length;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
