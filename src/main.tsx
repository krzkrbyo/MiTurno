import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './app/router'
import { initializeAuth } from './lib/auth-init'
import './styles/globals.css'

// Inicializar autenticación una sola vez al inicio
initializeAuth()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster position="top-right" richColors />
  </React.StrictMode>
)

