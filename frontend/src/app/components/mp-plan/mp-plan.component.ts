import { Component, OnInit } from '@angular/core';
import { MantenimientoService } from '../../services/mantenimiento.service';
import { AlertaActividad, EstadoAlerta, PlanMantenimiento, Vehiculo } from '../../models/mantenimiento.types';

interface PlanItem {
  id: number;
  marca: string;
  modelo: string;
  anio: string;
}

@Component({
  selector: 'app-mp-plan',
  templateUrl: './mp-plan.component.html',
  styleUrls: ['./mp-plan.component.scss']
})
export class MpPlanComponent implements OnInit {

  loading = true;

  // Vehículo activo (simulado, provisorio)
  vehiculoActivo: Vehiculo = {
    id: 1,
    placa: 'MP-001',
    kmActuales: 87500,
    kmUltimoServicio: 84000,
    fechaUltimoServicio: new Date('2024-12-15'),
    planMantenimientoId: 0
  };

  // Plan activo seleccionado
  planActivo: PlanMantenimiento = {
    id: 0,
    marca: '—',
    modelo: 'Sin plan',
    anio: 0,
    motor: '',
    tipoAceite: '',
    fuente: '',
    actividades: []
  };

  // Lista de planes (marca/modelo/año)
  planList: PlanItem[] = [];

  // Formulario
  formMarca = '';
  formModelo = '';
  formAnio = '';
  editandoPlan = false;
  editandoPlanId: number | null = null;

  // Alertas calculadas
  alertasAgrupadas!: Map<number, AlertaActividad[]>;
  intervalosOrdenados: number[] = [];
  gruposAbiertos = new Set<number>();
  mostrarModal = false;

  // Formulario de nueva actividad (modal)
  formActividadNombre = '';
  formActividadTipo = 'C';
  formActividadKm = 5000;
  formActividadMeses = 6;

  tiposOperacion = [
    { valor: 'C', label: 'Cambiar' },
    { valor: 'I', label: 'Inspeccionar' },
    { valor: 'A', label: 'Ajustar' },
    { valor: 'R', label: 'Realizar' },
    { valor: 'IC', label: 'Insp. y cambiar' }
  ];

  opcionesKm = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 90000, 105000, 120000];
  opcionesMeses = [3, 6, 12, 18, 24, 36, 48, 60, 72, 84];

  constructor(private mpService: MantenimientoService) {}

  ngOnInit(): void {
    this.cargarPlanesDesdeApi();
  }

  private cargarPlanesDesdeApi(): void {
    this.loading = true;
    this.mpService.obtenerTodosLosPlanesApi().subscribe({
      next: (planes) => {
        this.planList = planes.map(p => ({
          id: p.id,
          marca: p.marca,
          modelo: p.modelo,
          anio: `${p.anio} ${p.motor}`
        }));
        if (this.planList.length > 0) {
          this.seleccionarPlan(this.planList[0]);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // ----------------------------------------------------------
  // CRUD DE PLANES (Marca / Modelo / Año-Versión)
  // ----------------------------------------------------------

  guardarPlan(): void {
    const marca = this.formMarca.trim();
    const modelo = this.formModelo.trim();
    const anioStr = this.formAnio.trim();
    if (!marca || !modelo || !anioStr) return;

    // Extraer año numérico y versión
    const partes = anioStr.split(' ');
    const anioNum = parseInt(partes[0]) || 0;
    const version = partes.slice(1).join(' ').trim();

    const planRequest = {
      marca,
      modelo,
      anio: anioNum,
      motor: version || anioStr,
      tipoAceite: '',
      fuente: 'Usuario'
    };

    if (this.editandoPlan && this.editandoPlanId !== null) {
      // Actualizar existente
      this.mpService.actualizarPlanApi(this.editandoPlanId, planRequest).subscribe({
        next: () => {
          this.cargarPlanesDesdeApi();
          this.limpiarFormulario();
        }
      });
    } else {
      // Crear nuevo
      this.mpService.crearPlanApi(planRequest).subscribe({
        next: (nuevo) => {
          this.cargarPlanesDesdeApi();
          this.seleccionarPlan({ id: nuevo.id, marca: nuevo.marca, modelo: nuevo.modelo, anio: `${nuevo.anio} ${nuevo.motor}` });
          this.limpiarFormulario();
        }
      });
    }
  }

  editarPlan(item: PlanItem): void {
    this.formMarca = item.marca;
    this.formModelo = item.modelo;
    this.formAnio = item.anio;
    this.editandoPlan = true;
    this.editandoPlanId = item.id;
  }

  eliminarPlan(id: number): void {
    this.mpService.eliminarPlanApi(id).subscribe({
      next: () => {
        this.cargarPlanesDesdeApi();
        if (this.planActivo?.id === id) {
          this.planActivo = this.crearPlanVacio();
          this.alertasAgrupadas = new Map();
          this.intervalosOrdenados = [];
        }
      }
    });
  }

  cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  seleccionarPlan(item: PlanItem): void {
    this.loading = true;
    this.mpService.obtenerPlanApi(item.id).subscribe({
      next: (apiPlan) => {
        this.planActivo = this.mpService.apiToPlan(apiPlan);
        this.vehiculoActivo.planMantenimientoId = item.id;
        this.cargarAlertas();
        this.loading = false;
      },
      error: () => {
        this.planActivo = {
          id: item.id,
          marca: item.marca,
          modelo: item.modelo,
          anio: parseInt(item.anio) || 0,
          motor: item.anio.replace(/[0-9]/g, '').trim() || 'N/A',
          tipoAceite: '—',
          fuente: 'Usuario',
          actividades: []
        };
        this.loading = false;
      }
    });
  }

  private limpiarFormulario(): void {
    this.formMarca = '';
    this.formModelo = '';
    this.formAnio = '';
    this.editandoPlan = false;
    this.editandoPlanId = null;
  }

  private crearPlanVacio(): PlanMantenimiento {
    return {
      id: 0,
      marca: '—',
      modelo: 'Sin plan',
      anio: 0,
      motor: '',
      tipoAceite: '',
      fuente: '',
      actividades: []
    };
  }

  // ----------------------------------------------------------
  // CARGAR / CALCULAR ALERTAS
  // ----------------------------------------------------------

  private cargarAlertas(): void {
    if (!this.planActivo) {
      this.alertasAgrupadas = new Map();
      this.intervalosOrdenados = [];
      return;
    }
    this.alertasAgrupadas = this.mpService.obtenerAlertasAgrupadas(this.vehiculoActivo, this.planActivo);
    this.intervalosOrdenados = Array.from(this.alertasAgrupadas.keys()).sort((a, b) => a - b);

    this.gruposAbiertos.clear();
    this.intervalosOrdenados.forEach(km => {
      const alertas = this.alertasAgrupadas.get(km)!;
      const estado  = this.mpService.estadoDelGrupo(alertas);
      if (estado === 'vencido' || estado === 'proximo') {
        this.gruposAbiertos.add(km);
      }
    });
  }

  actualizarKm(km: number): void {
    this.vehiculoActivo.kmActuales = km;
    this.cargarAlertas();
  }

  cambiarPlan(planId: number): void {
    this.vehiculoActivo.planMantenimientoId = +planId;
    const item = this.planList.find(p => p.id === +planId);
    if (item) this.seleccionarPlan(item);
  }

  seleccionarPlanDesdeSelect(planId: number): void {
    const item = this.planList.find(p => p.id === planId);
    if (item) this.seleccionarPlan(item);
  }

  guardarActividad(): void {
    if (!this.formActividadNombre.trim() || !this.planActivo?.id) return;

    const request = {
      nombre: this.formActividadNombre.trim(),
      tipo: this.formActividadTipo,
      intervaloKm: this.formActividadKm,
      intervaloMeses: this.formActividadMeses
    };

    this.mpService.agregarActividadApi(this.planActivo.id, request).subscribe({
      next: () => {
        this.mostrarModal = false;
        this.formActividadNombre = '';
        this.formActividadTipo = 'C';
        this.formActividadKm = 5000;
        this.formActividadMeses = 6;
        // Recargar el plan para ver la nueva actividad
        const item = this.planList.find(p => p.id === this.planActivo.id);
        if (item) this.seleccionarPlan(item);
      },
      error: (err) => {
        console.error('Error al guardar actividad:', err);
        alert('Error al guardar la actividad. Verifique que el backend esté corriendo.');
      }
    });
  }

  toggleGrupo(km: number): void {
    if (this.gruposAbiertos.has(km)) {
      this.gruposAbiertos.delete(km);
    } else {
      this.gruposAbiertos.add(km);
    }
  }

  estaAbierto(km: number): boolean {
    return this.gruposAbiertos.has(km);
  }

  estadoDelGrupo(alertas: AlertaActividad[]): EstadoAlerta {
    return this.mpService.estadoDelGrupo(alertas);
  }

  get kmDesdeUltimoServicio(): number {
    return this.vehiculoActivo.kmActuales - this.vehiculoActivo.kmUltimoServicio;
  }

  get porcentajeCicloBase(): number {
    const intervaloBase = this.intervalosOrdenados[0] ?? 5000;
    return Math.min(100, Math.round((this.kmDesdeUltimoServicio / intervaloBase) * 100));
  }

  get colorBarra(): string {
    const pct = this.porcentajeCicloBase;
    if (pct >= 100) return '#E24B4A';
    if (pct >= 85)  return '#EF9F27';
    return '#3D8B37';
  }

  get totalVencidos(): number {
    return this.mpService.contarVencidos(this.vehiculoActivo, this.planActivo);
  }

  get totalProximos(): number {
    return this.mpService.contarProximos(this.vehiculoActivo, this.planActivo);
  }

  get kmPromedioDiario(): string {
    return '24.5';
  }

  get proximaInspeccion(): string {
    const hoy = new Date();
    hoy.setMonth(hoy.getMonth() + 1);
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${meses[hoy.getMonth()]} ${hoy.getDate()}, ${hoy.getFullYear()}`;
  }
}
