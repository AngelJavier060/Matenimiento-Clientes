import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ManagedUsersService } from '../../core/services/managed-users.service';
import { ManagedUser, ManagedUserRole } from '../../models/managed-user';

type FilterChip = 'ALL' | ManagedUserRole;

@Component({
  selector: 'app-user-admin-list',
  templateUrl: './user-admin-list.component.html',
  styleUrls: ['./user-admin-list.component.scss']
})
export class UserAdminListComponent implements OnInit, OnDestroy {
  users: ManagedUser[] = [];
  search = '';
  filter: FilterChip = 'ALL';
  page = 1;
  readonly pageSize = 10;
  isLoading = false;

  private sub?: Subscription;

  constructor(
    private managedUsers: ManagedUsersService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    // Cargar usuarios desde el backend
    this.managedUsers.loadUsers();
    this.sub = this.managedUsers.users$.subscribe((u) => {
      this.users = u;
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** Refrescar lista */
  refresh(): void {
    this.isLoading = true;
    this.managedUsers.loadUsers();
  }

  /** Desactivar/activar usuario */
  toggleStatus(user: ManagedUser): void {
    const id = Number(user.id);
    this.managedUsers.toggleUserStatus(id).subscribe({
      next: () => this.refresh(),
      error: (err) => alert('Error al cambiar estado: ' + err.message)
    });
  }

  /** Eliminar usuario */
  deleteUser(user: ManagedUser): void {
    if (!confirm(`¿Eliminar a ${user.fullName} permanentemente?`)) return;
    const id = Number(user.id);
    this.managedUsers.deleteUser(id).subscribe({
      next: () => this.refresh(),
      error: (err) => alert('Error al eliminar: ' + err.message)
    });
  }

  get filtered(): ManagedUser[] {
    let list = [...this.users];
    if (this.filter !== 'ALL') {
      list = list.filter((u) => u.role === this.filter);
    }
    const q = this.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    return list;
  }

  get paged(): ManagedUser[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get activeNowLabel(): string {
    const active = this.users.filter((u) => u.networkStatus === 'SYNCED').length;
    return `${active} / ${this.users.length}`;
  }

  setFilter(f: FilterChip): void {
    this.filter = f;
    this.page = 1;
  }

  roleLabel(role: ManagedUserRole): string {
    const m: Record<ManagedUserRole, string> = {
      SUPER: 'Super Usuario',
      ADMIN: 'Administrador',
      STANDARD: 'Estándar'
    };
    return m[role];
  }

  initials(u: ManagedUser): string {
    const p = u.fullName.trim().split(/\s+/).filter(Boolean);
    if (p.length === 0) {
      return '?';
    }
    if (p.length === 1) {
      return p[0].slice(0, 2).toUpperCase();
    }
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

    goNew(): void {
    this.router.navigate(['/users/new']);
  }

  goEdit(user: ManagedUser): void {
    this.router.navigate(['/users/edit', user.id]);
  }

  onSearchChange(): void {
    this.page = 1;
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  pageNumbers(): number[] {
    const t = this.totalPages;
    const cur = this.page;
    const out: number[] = [];
    for (let i = Math.max(1, cur - 1); i <= Math.min(t, cur + 1); i++) {
      out.push(i);
    }
    if (!out.includes(1)) {
      out.unshift(1);
    }
    if (!out.includes(t) && t > 1) {
      out.push(t);
    }
    return [...new Set(out)].sort((a, b) => a - b);
  }
}
