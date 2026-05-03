import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss']
})
export class VehicleListComponent implements OnInit {
  vehicles: VehicleResponse[] = [];
  loading = true;
  searchTerm = '';
  filterStatus: string = 'all';

  constructor(
    private vehicleService: VehicleService,
    private router: Router
  ) {}

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

  get filteredVehicles(): VehicleResponse[] {
    return this.vehicles.filter(v => {
      const matchSearch = !this.searchTerm ||
        v.brand.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (v.licensePlate?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);

      const matchStatus = this.filterStatus === 'all' ||
        (this.filterStatus === 'active' && v.isActive) ||
        (this.filterStatus === 'inactive' && !v.isActive);

      return matchSearch && matchStatus;
    });
  }

  viewDetail(id: number) {
    this.router.navigate(['/vehicles', id]);
  }

  editVehicle(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/vehicles/edit', id]);
  }

  deleteVehicle(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => this.loadVehicles()
      });
    }
  }

  newVehicle() {
    this.router.navigate(['/vehicles/new']);
  }
}
