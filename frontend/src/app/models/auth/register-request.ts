export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  documentId?: string;
  address?: string;
  role?: string;
}
