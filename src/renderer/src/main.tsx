import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AlertApp } from './screens/AlertApp'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el contenedor #root')

// La ventana flotante de alerta carga esta misma interfaz con el hash «#alert».
const isAlert = window.location.hash === '#alert'
if (isAlert) document.documentElement.classList.add('alert-window')

createRoot(container).render(<StrictMode>{isAlert ? <AlertApp /> : <App />}</StrictMode>)
