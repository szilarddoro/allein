import '@/App.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { EditorPage } from '@/pages/EditorPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { QueryProvider } from '@/lib/queryClient'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <EditorPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </React.StrictMode>,
)
