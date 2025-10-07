import '@/App.css'
import { AppLayout } from '@/components/AppLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/lib/QueryProvider'
import { BrowserPage } from '@/pages/browser/BrowserPage'
import { EditorPage } from '@/pages/editor/EditorPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import '@fontsource-variable/inter'
import '@fontsource-variable/reddit-mono'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <RouterProvider router={router} />
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
