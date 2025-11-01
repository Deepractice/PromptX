import './styles/globals.css'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<RouterProvider router={router} />)
}