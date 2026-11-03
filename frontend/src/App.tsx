import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ScrollToTop } from './components/ScrollToTop'
import { AuthProvider } from './context/AuthProvider'

const LandingPage = lazy(() =>
  import('./pages/landing/LandingPage').then((module) => ({ default: module.LandingPage })),
)
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
  import('./pages/po-draft/PODraftEditor').then((module) => ({ default: module.PODraftEditor })),
)
const BlogPage = lazy(() =>
  import('./pages/blog/BlogPage').then((module) => ({ default: module.BlogPage })),
)
const BlogArticlePage = lazy(() =>
  import('./pages/blog/BlogArticlePage').then((module) => ({ default: module.BlogArticlePage })),
)
const FaqPage = lazy(() =>
  import('./pages/faq/FaqPage').then((module) => ({ default: module.FaqPage })),
)
const TentangPage = lazy(() =>
  import('./pages/tentang/TentangPage').then((module) => ({ default: module.TentangPage })),
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
      <ScrollToTop />
      <Suspense fallback={<FullPageFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/artikel" element={<BlogPage />} />
          <Route path="/artikel/:slug" element={<BlogArticlePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/tentang" element={<TentangPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/app" element={<Dashboard />} />
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
