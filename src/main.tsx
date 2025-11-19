import '@/App.css'
import { AppLayout } from '@/components/layout/AppLayout'
import { OnboardingLayout } from '@/components/layout/OnboardingLayout'
import { ErrorFallback } from '@/components/ErrorFallback'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/lib/QueryProvider'
import { BrowserPage } from '@/pages/browser/BrowserPage'
import { EditorPage } from '@/pages/editor/EditorPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import '@fontsource-variable/inter'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { ModelDownloadProvider } from '@/lib/modelDownload/ModelDownloadProvider'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    ErrorBoundary: ErrorFallback,
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
      {
        path: '*',
        element: <Navigate to="/" />,
      },
    ],
  },
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      {
        index: true,
        element: <OnboardingPage />,
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
        <ModelDownloadProvider>
          <RouterProvider router={router} />
          <Toaster />
        </ModelDownloadProvider>
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
