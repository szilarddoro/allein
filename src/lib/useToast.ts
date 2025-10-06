import { useMemo } from 'react'
import { toast } from 'sonner'

export function useToast() {
  const memoizedToast = useMemo(() => {
    return {
      toast: {
        success: (message: string) => toast.success(message),
        error: (message: string) => toast.error(message),
        info: (message: string) => toast.info(message),
        warning: (message: string) => toast.warning(message),
        loading: (message: string) => toast.loading(message),
        dismiss: (id?: string | number) => toast.dismiss(id),
      },
    }
  }, [])

  return memoizedToast
}
