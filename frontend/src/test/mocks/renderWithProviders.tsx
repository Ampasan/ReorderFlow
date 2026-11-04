import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../../context/AuthProvider'
import type { ReactElement, ReactNode } from 'react'

interface WrapperOptions {
  routerProps?: MemoryRouterProps
}

function AllProviders({
  children,
  routerProps = {},
}: {
  children: ReactNode
  routerProps?: MemoryRouterProps
}) {
  return (
    <MemoryRouter {...routerProps}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & WrapperOptions,
) {
  const { routerProps, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerProps={routerProps}>{children}</AllProviders>
    ),
    ...renderOptions,
  })
}
