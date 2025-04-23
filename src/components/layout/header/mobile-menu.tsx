"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

type MenuOption = {
  label: string
  icon: React.ReactNode
  href: string
}

interface MobileMenuProps {
  options: MenuOption[]
}

export function MobileMenu({ options }: MobileMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative z-50" ref={menuRef}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Menu className="h-6 w-6 text-purple-400 hover:text-purple-300 transition" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-800 bg-gray-900/70 backdrop-blur-sm shadow-xl p-4 space-y-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                router.push(option.href)
                setOpen(false)
              }}
              className="w-full flex items-center gap-3 p-2 rounded-md bg-gray-800/50 hover:bg-purple-900/50 text-purple-300 font-medium transition-transform duration-200 hover:scale-105"
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
