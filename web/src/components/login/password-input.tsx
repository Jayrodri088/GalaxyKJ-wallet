"use client"

import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface LoginPasswordInputProps {
  password: string
  setPassword: (value: string) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  onEnter?: () => void
  disabled?: boolean
}

export function LoginPasswordInput({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onEnter,
  disabled = false,
}: LoginPasswordInputProps) {
  return (
    <div className="space-y-2 mb-2">
      <Label htmlFor="password" className="text-slate-300">
        Password
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          placeholder="Enter your wallet password"
          disabled={disabled}
          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-12 focus:border-purple-400 focus:ring-purple-400"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
