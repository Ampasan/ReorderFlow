import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { App } from './App'

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
