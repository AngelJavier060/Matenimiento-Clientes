import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ManagedUser, ManagedUserNetworkStatus, ManagedUserRole } from '../../models/managed-user';
import { TokenService } from './token.service';

interface BackendUser {
  id: number;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  documentId: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ManagedUsersService {
  private readonly apiUrl = environment.apiUrl;
  private readonly subject = new BehaviorSubject<ManagedUser[]>([]);
  readonly users$ = this.subject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  /** Carga todos los usuarios desde el backend */
  loadUsers(): void {
    this.http.get<BackendUser[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => {
        const mapped = users.map((u) => this.mapBackendToFrontend(u));
        this.subject.next(mapped);
      },
      error: () => {
        // Si falla, mantener datos actuales
        console.warn('No se pudieron cargar usuarios del backend');
      }
    });
  }

  /** Obtener snapshot actual */
  getUsers(): ManagedUser[] {
    return this.subject.value;
  }

    /** Actualizar un usuario en el backend */
  updateUser(id: number, data: {
    fullName?: string;
    email?: string;
    role?: string;
    documentId?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
    isActive?: boolean;
    newPassword?: string;
  }): Observable<BackendUser> {
    return this.http.put<BackendUser>(`${this.apiUrl}/users/${id}`, data).pipe(
      tap((updated) => {
        // Actualizar en la lista local
        const users = [...this.subject.value];
        const idx = users.findIndex((u) => u.id === String(updated.id));
        if (idx >= 0) {
          users[idx] = this.mapBackendToFrontend(updated);
          this.subject.next(users);
        }
      })
    );
  }

  /** Activar/Desactivar usuario */
  toggleUserStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/users/${id}/status`, {});
  }

  /** Subir avatar de usuario */
  uploadAvatar(userId: number, file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', String(userId));
    return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/upload/avatar`, formData).pipe(
      tap((res) => {
        // Actualizar avatar en la lista local
        const users = [...this.subject.value];
        const idx = users.findIndex((u) => u.id === String(userId));
        if (idx >= 0) {
          users[idx] = { ...users[idx], avatarUrl: res.avatarUrl };
          this.subject.next(users);
        }
      })
    );
  }

  /** Eliminar usuario (solo SUPER_ADMIN) */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`).pipe(
      tap(() => {
        const users = this.subject.value.filter((u) => u.id !== String(id));
        this.subject.next(users);
      })
    );
  }

  /** Mapea respuesta del backend al modelo del frontend */
    private mapBackendToFrontend(bu: BackendUser): ManagedUser {
      // Si avatarUrl es ruta relativa, convertir a URL completa del backend
      let avatarUrl = bu.avatarUrl;
      if (avatarUrl && avatarUrl.startsWith('/')) {
        avatarUrl = environment.apiUrl.replace('/api', '') + avatarUrl;
      }

            return {
        id: String(bu.id),
        fullName: bu.fullName,
        email: bu.email,
        role: this.mapRole(bu.role),
        lastAccessLabel: bu.lastLogin ? this.formatDate(bu.lastLogin) : 'Nunca',
        lastAccessDetail: bu.lastLogin ? 'Último acceso' : 'Sin actividad',
        networkStatus: bu.isActive ? 'SYNCED' : 'INACTIVE',
        avatarUrl,
        phone: bu.phone,
        address: bu.address,
        documentId: bu.documentId,
        createdAt: bu.createdAt
      };
    }

  private mapRole(role: 'SUPER_ADMIN' | 'ADMIN' | 'USER'): ManagedUserRole {
    switch (role) {
      case 'SUPER_ADMIN': return 'SUPER';
      case 'ADMIN': return 'ADMIN';
      case 'USER': return 'STANDARD';
    }
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Ahora';
      if (mins < 60) return `Hace ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Hace ${hours}h`;
      return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  }
}
