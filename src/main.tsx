import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { queryClient } from './services/api/query-client.ts'
import { bootstrapFirebase } from './services/firebase.ts'
import './index.css'

bootstrapFirebase()

const root = document.getElementById('root')

if (!root) {
  throw new Error('Elemento #root nao encontrado.')
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
