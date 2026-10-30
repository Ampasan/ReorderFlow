import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthProvider'

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })),
)
const StockList = lazy(() =>
  import('./pages/StockList').then((module) => ({ default: module.StockList })),
)
const POLogList = lazy(() =>
  import('./pages/POLogList').then((module) => ({ default: module.POLogList })),
)
const PODraftEditor = lazy(() =>
  import('./pages/PODraftEditor').then((module) => ({ default: module.PODraftEditor })),
)

function FullPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <p role="status" className="text-sm font-semibold text-brand-muted">
        Memuat halaman...
      </p>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<FullPageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stok" element={<StockList />} />
              <Route path="/po-log" element={<POLogList />} />
              <Route path="/po-log/:id/draft" element={<PODraftEditor />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
