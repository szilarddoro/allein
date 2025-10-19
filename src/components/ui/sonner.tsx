import { AlertTriangle, CheckCircle, CircleAlert, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      duration={3000}
      icons={{
        info: <Info aria-hidden="true" className="size-4 text-blue-600" />,
        success: (
          <CheckCircle aria-hidden="true" className="size-4 text-success" />
        ),
        error: (
          <CircleAlert aria-hidden="true" className="size-4 text-destructive" />
        ),
        warning: (
          <AlertTriangle
            aria-hidden="true"
            className="size-4 text-yellow-600"
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
