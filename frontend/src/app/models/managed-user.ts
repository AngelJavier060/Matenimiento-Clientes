export type ManagedUserRole = 'SUPER' | 'ADMIN' | 'STANDARD';
export type ManagedUserNetworkStatus = 'SYNCED' | 'INACTIVE' | 'BLOCKED';

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: ManagedUserRole;
  lastAccessLabel: string;
  lastAccessDetail: string;
  networkStatus: ManagedUserNetworkStatus;
  avatarUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  documentId?: string | null;
  createdAt?: string | null;
}
