"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface LoginErrorAlertProps {
  message: string
}

export function LoginErrorAlert({ message }: LoginErrorAlertProps) {
  if (!message) return null

  return (
    <Alert className="mb-4 bg-red-500/10 border-red-500/20 text-red-400">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{message}</AlertDescription>
      </div>
    </Alert>
  )
}
