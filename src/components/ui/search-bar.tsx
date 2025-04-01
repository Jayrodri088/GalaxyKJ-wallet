"use client"

import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SearchBar() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by address, token, amount..."
          className="pl-10 w-80 bg-[#1F2937] bg-opacity-50 border-gray-700 focus:border-purple-500"
        />
      </div>
      <Button variant="outline" size="icon" className="h-10 w-10 border-gray-700 bg-[#1F2937] bg-opacity-50">
        <Filter className="h-4 w-4" />
        <span className="sr-only">Filters</span>
      </Button>
    </div>
  )
}

