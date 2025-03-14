export interface Automation {
    id?: string
    type: "payment" | "swap" | "rule"
    name: string
    description?: string
  

    recipient?: string
    asset?: string
    amount?: number | string
    frequency?: "daily" | "weekly" | "monthly"
    memo?: string
    nextExecution?: string
  

    assetFrom?: string
    assetTo?: string
    amountFrom?: number | string
    condition?: "price_increase" | "price_decrease" | "price_target"
    conditionValue?: number | string
    lastExecution?: string
  

    threshold?: number | string
    action?: "alert" | "buy" | "sell" | "custom"
  

    active?: boolean
    createdAt?: string
    executionCount?: number
  }
  
  