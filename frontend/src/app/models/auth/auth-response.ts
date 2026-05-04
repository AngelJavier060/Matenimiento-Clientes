export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  documentId?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  isActive: boolean;
}
