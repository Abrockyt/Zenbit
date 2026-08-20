window.addEventListener('error', (e) => { fetch('http://localhost:8000/log', { method: 'POST', body: e.error ? e.error.stack : e.message }).catch(()=>{}); });
window.addEventListener('unhandledrejection', (e) => { fetch('http://localhost:8000/log', { method: 'POST', body: e.reason ? e.reason.stack : String(e.reason) }).catch(()=>{}); });
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

