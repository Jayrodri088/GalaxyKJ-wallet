"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  initialValue?: string
}

export function SearchBar({ 
  placeholder = "Search by address, token, amount...", 
  onSearch,
  initialValue = ""
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialValue || searchParams?.get('search') || '')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Update URL with search parameter
      const params = new URLSearchParams(searchParams?.toString())
      params.set('search', searchQuery.trim())
      router.push(`/transactions?${params.toString()}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    if (onSearch) {
      onSearch('')
    }
    
    // Remove search parameter from URL
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('search')
    const newUrl = params.toString() ? `/transactions?${params.toString()}` : '/transactions'
    router.push(newUrl)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className="pl-10 pr-10 w-80 bg-[#1F2937] bg-opacity-50 border-gray-700 focus:border-purple-500"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-10 w-10 border-gray-700 bg-[#1F2937] bg-opacity-50"
        onClick={handleSearch}
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-10 w-10 border-gray-700 bg-[#1F2937] bg-opacity-50"
      >
        <Filter className="h-4 w-4" />
        <span className="sr-only">Filters</span>
      </Button>
    </div>
  )
}

