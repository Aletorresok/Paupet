import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registrarServiceWorker } from './lib/avisos'

// Service worker para los avisos al celular (no hace nada en modo demo ni si el navegador no lo permite).
registrarServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
