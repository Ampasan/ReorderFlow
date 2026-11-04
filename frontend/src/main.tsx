import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { App } from './App'
import { API_BASE_URL } from './utils/constants'

function warmApiConnection() {
  try {
    const origin = new URL(API_BASE_URL, window.location.origin).origin
    if (origin === window.location.origin) return

    for (const rel of ['preconnect', 'dns-prefetch']) {
      const link = document.createElement('link')
      link.rel = rel
      link.href = origin
      if (rel === 'preconnect') link.crossOrigin = ''
      document.head.appendChild(link)
    }
  } catch {
    return
  }
}

warmApiConnection()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        containerStyle={{ top: 76 }}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#2A1A0E',
            color: '#FEF3E2',
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: '420px',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
