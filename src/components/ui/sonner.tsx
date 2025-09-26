import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useTheme } from 'next-themes'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      duration={3000}
      icons={{
        info: <Info aria-hidden="true" className="w-4 h-4 text-blue-700" />,
        success: (
          <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-700" />
        ),
        error: <XCircle aria-hidden="true" className="w-4 h-4 text-red-600" />,
        warning: (
          <AlertTriangle
            aria-hidden="true"
            className="w-4 h-4 text-yellow-600"
          />
        ),
      }}
      className="toaster group"
      toastOptions={{
        classNames: {
          success: 'bg-green-500',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
