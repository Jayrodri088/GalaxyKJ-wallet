"use client"
import type { ToastProps } from "@/components/ui/toast"

export const useToast = () => {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      console.log("Toast:", title, description)
    },
    dismiss: (toastId?: string) => {},
  }
}

