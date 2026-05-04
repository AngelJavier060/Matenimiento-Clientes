export interface Client {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
