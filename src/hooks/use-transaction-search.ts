import { useState, useEffect, useMemo } from "react"
import { fetchTransactions } from "@/lib/stellar/transactions"
import { useWalletStore } from "@/store/wallet-store"

type TransactionType = "receive" | "send" | "swap"
type TransactionStatus = "completed" | "pending" | "failed"

interface Transaction {
  id: number
  type: TransactionType
  asset?: string
  assetFrom?: string
  assetTo?: string
  amount?: string
  amountFrom?: number
  amountTo?: number
  from?: string
  to?: string
  date: string
  status: TransactionStatus
}

export function useTransactionSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const publicKey = useWalletStore((state) => state.publicKey)

  // Load initial transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!publicKey) return
      
      try {
        setIsLoading(true)
        const fetchedTransactions = await fetchTransactions({
          account: publicKey,
          limit: 50, // Get more transactions for searching
        })
        setTransactions(fetchedTransactions)
      } catch (error) {
        console.error("Failed to load transactions:", error)
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [publicKey])

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase().trim()
    
    return transactions.filter((tx) => {
      // Search by transaction type
      if (tx.type.toLowerCase().includes(query)) return true
      
      // Search by asset
      if (tx.asset?.toLowerCase().includes(query)) return true
      if (tx.assetFrom?.toLowerCase().includes(query)) return true
      if (tx.assetTo?.toLowerCase().includes(query)) return true
      
      // Search by amount
      if (tx.amount?.toString().includes(query)) return true
      if (tx.amountFrom?.toString().includes(query)) return true
      if (tx.amountTo?.toString().includes(query)) return true
      
      // Search by addresses (partial matching for Stellar addresses)
      if (tx.from?.toLowerCase().includes(query)) return true
      if (tx.to?.toLowerCase().includes(query)) return true
      
      // Search by status
      if (tx.status.toLowerCase().includes(query)) return true
      
      // Search by date (format: MMM DD, YYYY)
      const dateString = new Date(tx.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toLowerCase()
      if (dateString.includes(query)) return true
      
      return false
    })
  }, [transactions, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(true)
    setHasSearched(true)
    
    // Simulate search delay for UX
    setTimeout(() => {
      setIsSearching(false)
    }, 300)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setHasSearched(false)
    setIsSearching(false)
  }

  return {
    searchQuery,
    setSearchQuery: handleSearch,
    clearSearch,
    transactions: filteredTransactions,
    isLoading,
    isSearching,
    hasSearched,
    hasResults: filteredTransactions.length > 0,
    totalTransactions: transactions.length,
  }
} 