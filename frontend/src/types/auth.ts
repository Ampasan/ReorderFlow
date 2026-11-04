export type UserRole = 'admin' | 'manager'

export interface User {
  id: number
  email: string
  nama: string
  role: UserRole
  created_at: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}
