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
  phone?: string;
  avatarUrl?: string;
}
