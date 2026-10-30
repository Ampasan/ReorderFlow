import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import toast from 'react-hot-toast'
import { UNAUTHORIZED_EVENT } from '../services/api'
import { getMe, login as loginRequest } from '../services/authService'
import type { User } from '../types/auth'
import { clearSession, getToken, getUser, saveSession } from '../utils/authStorage'
import { AuthContext } from './authContext'
import type { AuthContextValue, AuthStatus } from './authContext'

interface AuthState {
  user: User | null
  status: AuthStatus
}

function readInitialState(): AuthState {
  const token = getToken()
  const user = getUser()
  if (!token || !user) {
    return { user: null, status: 'anonymous' }
  }
  return { user, status: 'authenticated' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readInitialState)

  useEffect(() => {
    if (!getToken()) return
    let active = true

    getMe()
      .then((user) => {
        if (active) setState({ user, status: 'authenticated' })
      })
      .catch(() => {
        if (!active) return
        clearSession()
        setState({ user: null, status: 'anonymous' })
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setState({ user: null, status: 'anonymous' })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest({ email, password })
    saveSession(result.token, result.user)
    setState({ user: result.user, status: 'authenticated' })
    toast.success('Login berhasil')
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setState({ user: null, status: 'anonymous' })
    toast.success('Anda telah keluar')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user: state.user, status: state.status, login, logout }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
