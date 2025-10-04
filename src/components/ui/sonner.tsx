import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      duration={3000}
      icons={{
        info: <Info aria-hidden="true" className="w-4 h-4 text-blue-600" />,
        success: (
          <CheckCircle aria-hidden="true" className="w-4 h-4 text-green-600" />
        ),
        error: <XCircle aria-hidden="true" className="w-4 h-4 text-red-600" />,
        warning: (
          <AlertTriangle
            aria-hidden="true"
            className="w-4 h-4 text-yellow-600"
          />
        ),
      }}
      className="toaster group select-none"
      toastOptions={{
        classNames: {
          default: '!bg-secondary !text-foreground !border !border-input',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
