export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}