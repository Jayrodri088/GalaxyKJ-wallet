"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, ReceiptIcon as ReceiveIcon, Repeat, Zap, BookOpen, PenSquare } from "lucide-react"

export function WalletActions() {
  const router = useRouter()

  const actions = [
    {
      label: "Send",
      icon: Send,
      href: "/send-receive?tab=send",
      gradient: "from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700",
      shadow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    },
    {
      label: "Receive",
      icon: ReceiveIcon,
      href: "/send-receive?tab=receive",
      gradient: "from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700",
      shadow: "hover:shadow-[0_0_15px_rgba(147,51,234,0.5)]",
    },
    {
      label: "Swap",
      icon: Repeat,
      href: "/swap",
      gradient: "from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700",
      shadow: "hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]",
    },
    {
      label: "Automate",
      icon: Zap,
      href: "/automation",
      gradient: "from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600",
      shadow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]",
    },
    {
      label: "Learn",
      icon: BookOpen,
      href: "/education-center",
      gradient: "from-green-600 to-green-800 hover:from-green-500 hover:to-green-700",
      shadow: "hover:shadow-[0_0_15px_rgba(22,163,74,0.5)]",
    },
    {
      label: "Sign",
      icon: PenSquare,
      href: "/signature-tools",
      gradient: "from-pink-600 to-pink-800 hover:from-pink-500 hover:to-pink-700",
      shadow: "hover:shadow-[0_0_15px_rgba(219,39,119,0.5)]",
    },
  ]

  return (
    <div className="grid grid-cols-6 gap-4">
      {actions.map(({ label, icon: Icon, href, gradient, shadow }) => (
        <Button
          key={label}
          onClick={() => router.push(href)}
          className={`h-20 bg-gradient-to-br ${gradient} border-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${shadow}`}
        >
          <Icon className="h-6 w-6" />
          <span>{label}</span>
        </Button>
      ))}
    </div>
  )
}
