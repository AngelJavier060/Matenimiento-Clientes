import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService, ClientRequest } from '../../../core/services/client.service';
import { VehicleRequest } from '../../../models/vehicle/vehicle-request';
import { VehicleResponse } from '../../../models/vehicle/vehicle-response';
import { Client } from '../../../models/client';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  /* ── Lista de clientes ── */
  clients: Client[] = [];
  loading = true;
  searchTerm = '';
  allVehicles: VehicleResponse[] = [];

  /* ── Modal de registro ── */
  showModal = false;
  submitting = false;
  error = '';
  editingClient: Client | null = null;

  /* ── Formulario cliente ── */
  clientFullName = '';
  phone = '';
  email = '';
  address = '';
  clientNotes = '';

  /* ── Formulario vehículo ── */
  vBrand = '';
  vModel = '';
  vYear: number | null = null;
  vPlate = '';
  vVin = '';
  vColor = '';
  vMileage: number | null = null;
  vFuel = 'GASOLINE';
  vTransmission = 'AUTOMATIC';
  vEngineeringNotes = '';
  vPreviewUrl: string | null = null;
  vSelectedFile: File | null = null;

  /* ── KPI ── */
  get kpiTotal(): number {
    return this.clients.length;
  }
  get kpiActivos(): number {
    return this.clients.filter(c => c.status === 'activo').length;
  }
  get kpiNuevos(): number {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return this.clients.filter(c => {
      if (!c.createdAt) return false;
      return new Date(c.createdAt) >= monthAgo;
    }).length;
  }

  /** Resuelve URLs de imágenes contra el backend */
  backendImage(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = environment.apiUrl.replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  /** Obtener la primera foto de vehículo de un cliente */
  clientVehicleImage(clientId: number): string | null {
    const v = this.allVehicles.find(v => v.clientId === clientId);
    return this.backendImage(v?.imageUrl);
  }

  clientVehicleCount(clientId: number): number {
    return this.allVehicles.filter(v => v.clientId === clientId).length;
  }

  clientVehiclePlate(clientId: number): string | null {
    const v = this.allVehicles.find(v => v.clientId === clientId);
    return v?.licensePlate || null;
  }

  constructor(
    private vehicleService: VehicleService,
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  private loadClients(): void {
    this.loading = true;
    this.clientService.getAllClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.loadVehicles();
      },
      error: () => this.loading = false
    });
  }

  private loadVehicles(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.allVehicles = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  /* ── Filtro ── */
  get filteredClients(): Client[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false)
    );
  }

  /* ── Modal ── */
  openModal(): void {
    this.editingClient = null;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  openEditModal(c: Client): void {
    this.editingClient = c;
    this.clientFullName = c.fullName;
    this.phone = c.phone || '';
    this.email = c.email || '';
    this.address = c.address || '';
    this.clientNotes = c.notes || '';

    // Cargar datos del vehículo del cliente
    const clientVehicle = this.allVehicles.find(v => v.clientId === c.id);
    if (clientVehicle) {
      this.vBrand = clientVehicle.brand || '';
      this.vModel = clientVehicle.model || '';
      this.vYear = clientVehicle.year || null;
      this.vPlate = clientVehicle.licensePlate || '';
      this.vVin = clientVehicle.vin || '';
      this.vColor = clientVehicle.color || '';
      this.vMileage = clientVehicle.mileage ?? null;
      this.vFuel = clientVehicle.fuelType || 'GASOLINE';
      this.vTransmission = clientVehicle.transmission || 'AUTOMATIC';
      this.vEngineeringNotes = '';
      // Mostrar preview de la imagen actual
      if (clientVehicle.imageUrl) {
        this.vPreviewUrl = this.backendImage(clientVehicle.imageUrl);
      }
      this.vSelectedFile = null;
    }

    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    document.body.style.overflow = '';
    this.resetForm();
  }

  private resetForm(): void {
    this.editingClient = null;
    this.clientFullName = '';
    this.phone = '';
    this.email = '';
    this.address = '';
    this.clientNotes = '';
    this.vBrand = '';
    this.vModel = '';
    this.vYear = null;
    this.vPlate = '';
    this.vVin = '';
    this.vColor = '';
    this.vMileage = null;
    this.vFuel = 'GASOLINE';
    this.vTransmission = 'AUTOMATIC';
    this.vEngineeringNotes = '';
    this.vPreviewUrl = null;
    this.vSelectedFile = null;
    this.error = '';
    this.submitting = false;
  }

  /* ── Foto vehículo ── */
  onVehicleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error = 'Solo se permiten imágenes (JPG, PNG, WEBP)';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error = 'La imagen no puede superar 2MB';
      return;
    }
    this.vSelectedFile = file;
    this.error = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.vPreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /* ── Envío ── */
  onSubmit(): void {
    this.error = '';
    const name = this.clientFullName.trim();
    const mail = this.email.trim();
    const tel = this.phone.trim();

    if (!name || !tel || !mail) {
      this.error = 'Nombre completo, teléfono y correo son obligatorios';
      return;
    }

    const wantVehicle = !!(this.vBrand.trim() && this.vModel.trim());
    const yearOk = this.vYear == null || (this.vYear >= 1900 && this.vYear <= 2030);
    if (wantVehicle && !yearOk) {
      this.error = 'Revise el año del vehículo (1900–2030)';
      return;
    }

    this.submitting = true;
    const clientData: ClientRequest = {
      fullName: name,
      email: mail || undefined,
      phone: tel || undefined,
      address: this.address.trim() || undefined,
      notes: this.clientNotes.trim() || undefined
    };

        if (this.editingClient) {
      // Modo edicion: actualizar cliente
      this.clientService.updateClient(this.editingClient.id, clientData).subscribe({
        next: () => {
          const wantVehicle = !!(this.vBrand.trim() && this.vModel.trim());
          if (!wantVehicle) {
            this.onSuccess();
            return;
          }
          // Buscar si ya tiene un vehículo
          const existingVehicle = this.allVehicles.find(v => v.clientId === this.editingClient!.id);
          const updateOrCreate = existingVehicle
            ? this.vehicleService.updateVehicle(existingVehicle.id, this.buildVehiclePayload(this.editingClient!.id))
            : this.vehicleService.createVehicle(this.buildVehiclePayload(this.editingClient!.id));

          updateOrCreate.subscribe({
            next: (updatedVeh) => {
              // Subir nueva foto si se seleccionó
              if (this.vSelectedFile) {
                this.vehicleService.uploadVehiclePhoto(updatedVeh.id, this.vSelectedFile).subscribe({
                  next: () => this.onSuccess(),
                  error: () => this.onSuccess()
                });
              } else {
                this.onSuccess();
              }
            },
            error: () => this.onSuccess()
          });
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.message ?? 'Error al actualizar el cliente';
        }
    });
    } else {
      // Modo creacion
      this.clientService.createClient(clientData).subscribe({
        next: (newClient) => {
          if (!wantVehicle) {
            this.onSuccess();
            return;
          }
          const req = this.buildVehiclePayload(newClient.id);
          this.vehicleService.createVehicle(req).subscribe({
            next: (newVehicle) => {
              // Subir foto si se seleccionó
              if (this.vSelectedFile) {
                this.vehicleService.uploadVehiclePhoto(newVehicle.id, this.vSelectedFile).subscribe({
                  next: () => this.onSuccess(),
                  error: () => this.onSuccess()
                });
              } else {
                this.onSuccess();
              }
            },
            error: () => this.onSuccess()
          });
        },
        error: (err) => {
          this.submitting = false;
          this.error = err.error?.message ?? 'Error al crear el cliente';
        }
      });
    }
  }

  private onSuccess(): void {
    this.submitting = false;
    this.loadClients();
    this.closeModal();
  }

  private buildVehiclePayload(clientId: number): VehicleRequest {
    const notesParts = [this.vEngineeringNotes?.trim()].filter(Boolean) as string[];
    if (this.address.trim()) {
      notesParts.push(`Domicilio declarado:\n${this.address.trim()}`);
    }
    if (this.clientNotes.trim()) {
      notesParts.push(`Notas:\n${this.clientNotes.trim()}`);
    }
    return {
      brand: this.vBrand.trim(),
      model: this.vModel.trim(),
      year: this.vYear ?? undefined,
      licensePlate: this.vPlate.trim() || undefined,
      vin: this.vVin.trim() ? this.vVin.trim().slice(0, 17) : undefined,
      mileage: this.vMileage ?? undefined,
      fuelType: this.vFuel || undefined,
      transmission: this.vTransmission || undefined,
      color: this.vColor.trim() || undefined,
      clientId,
      notes: notesParts.length ? notesParts.join('\n\n') : undefined
    };
  }

  /* ── Acciones ── */
  statusLabel(c: Client): string {
    return c.status === 'activo' ? 'Activo' : 'Inactivo';
  }

  statusClass(c: Client): string {
    return c.status === 'activo' ? 'cl-badge--ok' : 'cl-badge--off';
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  deleteClient(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('¿Eliminar este cliente?')) return;
    this.clientService.deleteClient(id).subscribe({
      next: () => this.loadClients()
    });
  }

  viewVehicles(clientId: number): void {
    this.router.navigate(['/vehicles']);
  }
}
