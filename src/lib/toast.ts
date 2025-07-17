import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  id?: string
}

/**
 * Toast utility for displaying notifications throughout the app
 *
 * Usage:
 * - toast.success('File saved successfully')
 * - toast.error('Failed to load project', { description: 'Please check permissions' })
 * - toast.warning('Unsaved changes', { action: { label: 'Save', onClick: () => save() } })
 */
export const toast = {
  /**
   * Display a success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration,
      id: options?.id,
    })
  },

  /**
   * Display an error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000, // Error toasts last longer by default
      id: options?.id,
    })
  },

  /**
   * Display a warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
      id: options?.id,
    })
  },

  /**
   * Display an info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration,
      id: options?.id,
    })
  },

  /**
   * Display a basic toast without specific styling
   */
  message: (message: string, options?: ToastOptions) => {
    return sonnerToast.message(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration,
      id: options?.id,
    })
  },

  /**
   * Display a loading toast that can be updated
   */
  loading: (message: string, options?: Omit<ToastOptions, 'action'>) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration,
      id: options?.id,
    })
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id)
  },

  /**
   * Promise-based toast for async operations
   */
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((result: T) => string)
      error: string | ((error: Error) => string)
      description?: string
      action?: {
        label: string
        onClick: () => void
      }
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      description: options.description,
      action: options.action,
    })
  },
}

// Export individual toast functions for convenience
export const {
  success,
  error,
  warning,
  info,
  message,
  loading,
  dismiss,
  promise,
} = toast
