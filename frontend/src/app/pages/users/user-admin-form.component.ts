import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ManagedUsersService } from '../../core/services/managed-users.service';
import { ManagedUserRole } from '../../models/managed-user';

function passwordMatchFn(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password');
  const c = group.get('confirmPassword');
  if (!p || !c) { return null; }
  if (!p.value || !c.value) { return null; }
  return p.value === c.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-user-admin-form',
  templateUrl: './user-admin-form.component.html',
  styleUrls: ['./user-admin-form.component.scss']
})
export class UserAdminFormComponent implements OnInit {
  editMode = false;
  editUserId: number | null = null;
  submitting = false;
  loading = false;
  apiError = '';
  previewUrl: string | null = null;
  avatarUrl: string | null = null;
  uploading = false;
  selectedFile: File | null = null;

  readonly form = this.fb.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      documentId: [''],
      password: [''],
      confirmPassword: [''],
      role: ['STANDARD' as ManagedUserRole, Validators.required],
    },
    { validators: passwordMatchFn }
  );

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private managedUsers: ManagedUsersService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.editUserId = Number(id);
      this.loadUserData(this.editUserId);
      // En edición, la contraseña es opcional
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.setValidators([Validators.minLength(6)]);
      this.form.get('confirmPassword')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirmPassword')?.updateValueAndValidity();
    } else {
      // Creación: contraseña requerida
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('confirmPassword')?.setValidators([Validators.required]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirmPassword')?.updateValueAndValidity();
    }
  }

        private loadUserData(id: number): void {
    this.loading = true;
    const sub = this.managedUsers.users$.subscribe((users) => {
      const user = users.find((u) => u.id === String(id));
      if (user) {
        this.form.patchValue({
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          address: user.address || '',
          documentId: user.documentId || ''
        });
        this.avatarUrl = user.avatarUrl || null;
        this.previewUrl = user.avatarUrl || null;
        this.loading = false;
        sub.unsubscribe();
      }
    });
    this.managedUsers.loadUsers();
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.apiError = 'Solo se permiten imágenes (JPG, PNG, WEBP)';
      return;
    }
    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.apiError = 'La imagen no puede superar 2MB';
      return;
    }

    this.selectedFile = file;
    this.apiError = '';

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Si es edición, subir automáticamente
    if (this.editMode && this.editUserId) {
      this.uploadAvatar();
    }
  }

  uploadAvatar(): void {
    if (!this.selectedFile || !this.editUserId) return;
    this.uploading = true;
    this.managedUsers.uploadAvatar(this.editUserId, this.selectedFile).subscribe({
      next: (res) => {
        this.avatarUrl = res.avatarUrl;
        this.uploading = false;
        this.selectedFile = null;
      },
      error: (err) => {
        this.uploading = false;
        this.apiError = 'Error al subir la imagen: ' + err.message;
      }
    });
  }

  removeAvatar(): void {
    if (!this.editUserId) return;
    if (!confirm('¿Eliminar la foto de perfil?')) return;
    this.managedUsers.updateUser(this.editUserId, { avatarUrl: '' }).subscribe({
      next: () => {
        this.avatarUrl = null;
        this.previewUrl = null;
        this.selectedFile = null;
        this.managedUsers.loadUsers();
      },
      error: (err) => {
        this.apiError = 'Error al eliminar la foto: ' + err.message;
      }
    });
  }

  passwordMismatch(): boolean {
    const g = this.form;
    if (this.editMode) {
      if (!g.get('password')?.value && !g.get('confirmPassword')?.value) return false;
    }
    const touched = !!(g.get('confirmPassword')?.touched || g.get('password')?.touched);
    return touched && !!g.errors?.['passwordMismatch'];
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting = true;
    this.apiError = '';

    const roleMap: Record<string, string> = {
      'SUPER': 'SUPER_ADMIN',
      'ADMIN': 'ADMIN',
      'STANDARD': 'USER'
    };

        if (this.editMode && this.editUserId) {
      // === MODO EDICIÓN: PUT /api/users/{id} ===
      const payload: any = {};
      if (v.fullName?.trim()) payload.fullName = v.fullName.trim();
      if (v.email?.trim()) payload.email = v.email.trim();
      if (v.phone?.trim()) payload.phone = v.phone.trim();
      if (v.address?.trim()) payload.address = v.address.trim();
      if (v.documentId?.trim()) payload.documentId = v.documentId.trim();
      if (v.role) payload.role = roleMap[v.role];
      if (v.password) payload.newPassword = v.password;

      this.managedUsers.updateUser(this.editUserId, payload).subscribe({
        next: () => {
          this.managedUsers.loadUsers();
          this.router.navigate(['/users']);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.apiError = this.extractError(err);
        }
      });
    } else {
      // === MODO CREACIÓN: POST /api/auth/register (rol incluido en 1 sola llamada) ===
      this.auth.registerSystemUser({
        fullName: v.fullName!.trim(),
        email: v.email!.trim(),
        password: v.password!,
        phone: v.phone?.trim() || undefined,
        address: v.address?.trim() || undefined,
        documentId: v.documentId?.trim() || undefined,
        role: v.role && v.role !== 'STANDARD' ? roleMap[v.role] : undefined
      }).subscribe({
        next: () => {
          this.managedUsers.loadUsers();
          this.router.navigate(['/users']);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.apiError = this.extractError(err);
        }
      });
    }
  }

  private extractError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string } | string | undefined;
    const msg = typeof body === 'object' && body?.message
      ? body.message
      : typeof body === 'string' ? body : err.message;
    return msg || 'Error al procesar la solicitud.';
  }
}
