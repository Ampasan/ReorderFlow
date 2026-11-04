import { get } from './api'
import { post } from './api'
import type { LoginCredentials, LoginResponse, User } from '../types/auth'

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', credentials)
}

export function getMe(): Promise<User> {
  return get<User>('/api/auth/me')
}
