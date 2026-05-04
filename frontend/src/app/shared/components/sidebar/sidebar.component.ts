import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';

export interface SidebarNavLink {
  path: string;
  icon: string;
  label: string;
  /** Si true, solo activo con URL exacta (p. ej. dashboard). */
  exact?: boolean;
}

export interface SidebarNavSubLink {
  label: string;
  path: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: any;
  collapsed = false;
  maintenanceOpen = true;
  private sub?: Subscription;

  readonly navLinks: SidebarNavLink[] = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
    { path: '/users', icon: 'group', label: 'Gestión de usuarios' },
    { path: '/register', icon: 'person_add', label: 'Registro de clientes' },
    { path: '/vehicles', icon: 'airport_shuttle', label: 'Vehículos' }
  ];

  readonly maintenanceIcon = 'build';
  readonly maintenanceLabel = 'Mantenimientos';
  readonly maintenanceChildren: SidebarNavSubLink[] = [
    {
      label: 'Correctivo',
      path: '/maintenance',
      queryParams: { categoria: 'correctivo' }
    },
    {
      label: 'Preventivo',
      path: '/maintenance',
      queryParams: { categoria: 'preventivo' }
    }
  ];

  readonly remindersLink: SidebarNavLink = {
    path: '/reminders',
    icon: 'notifications',
    label: 'Recordatorios'
  };

  /** Enlace principal de Mantenimientos: activo en cualquier variante `/maintenance` */
  readonly maintenanceParentMatch = {
    paths: 'exact' as const,
    queryParams: 'ignored' as const,
    fragment: 'ignored' as const,
    matrixParams: 'ignored' as const
  };

  /** Subítems Correctivo / Preventivo comparan también el query `categoria` */
  readonly maintenanceSubMatch = {
    paths: 'exact' as const,
    queryParams: 'subset' as const,
    fragment: 'ignored' as const,
    matrixParams: 'ignored' as const
  };

  toggleMaintenanceMenu(): void {
    this.maintenanceOpen = !this.maintenanceOpen;
  }

  constructor(
    public sidebarState: SidebarStateService,
    private authService: AuthService,
    private router: Router
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.collapsed = this.sidebarState.collapsed;
    this.sub = this.sidebarState.collapsed$.subscribe((c) => {
      this.collapsed = c;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
