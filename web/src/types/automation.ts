export interface Automation {
    id?: string
    type: "payment" | "swap" | "rule"
    name: string
    description?: string
  
    // Payment fields
    recipient?: string
    asset?: string
    amount?: number | string
    frequency?: "once" | "weekly" | "monthly" | "yearly" // Actualizado para coincidir con la base de datos
    memo?: string
    nextExecution?: string
  
    // Swap fields
    assetFrom?: string
    assetTo?: string
    amountFrom?: number | string
    condition?: "price_increase" | "price_decrease" | "price_target"
    conditionValue?: number | string
    lastExecution?: string
  
    // Rule fields
    threshold?: number | string
    action?: "alert" | "buy" | "sell" | "custom"
  
    // Common fields
    active?: boolean
    createdAt?: string
    executionCount?: number
}
  
  