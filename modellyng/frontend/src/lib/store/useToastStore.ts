import { create } from "zustand"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number // Exactly 5000ms by default
}

interface ToastStore {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, type = "info", duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, duration)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

// Export convenient global helper
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, "success", duration),
  error: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, "error", duration),
  info: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, "info", duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().showToast(msg, "warning", duration),
}
