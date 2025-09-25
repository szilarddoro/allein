import '@/App.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { EditorPage } from '@/pages/editor/EditorPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { QueryProvider } from '@/lib/QueryProvider'
import { Toaster } from '@/components/ui/sonner'
import { BrowserPage } from '@/pages/browser/BrowserPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <BrowserPage />,
      },
      {
        path: 'editor',
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
      <Toaster />
    </QueryProvider>
  </React.StrictMode>,
)
