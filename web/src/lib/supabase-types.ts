export interface Database {
  public: {
    Tables: {
      scheduled_payments: {
        Row: {
          id: string
          user_id: string
          public_key: string
          encrypted_secret: string
          recipient: string
          asset: string
          amount: number
          memo: string | null
          frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
          execute_at: string
          executed_at: string | null
          tx_hash: string | null
          last_error: string | null
          status: 'pending' | 'executed' | 'cancelled' | 'error'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          public_key: string
          encrypted_secret: string
          recipient: string
          asset: string
          amount: number
          memo?: string | null
          frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
          execute_at: string
          executed_at?: string | null
          tx_hash?: string | null
          last_error?: string | null
          status?: 'pending' | 'executed' | 'cancelled' | 'error'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          public_key?: string
          encrypted_secret?: string
          recipient?: string
          asset?: string
          amount?: number
          memo?: string | null
          frequency?: 'once' | 'weekly' | 'monthly' | 'yearly'
          execute_at?: string
          executed_at?: string | null
          tx_hash?: string | null
          last_error?: string | null
          status?: 'pending' | 'executed' | 'cancelled' | 'error'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
      payment_status: 'pending' | 'executed' | 'cancelled' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for use in the application
export type ScheduledPayment = Database['public']['Tables']['scheduled_payments']['Row']
export type ScheduledPaymentInsert = Database['public']['Tables']['scheduled_payments']['Insert']
export type ScheduledPaymentUpdate = Database['public']['Tables']['scheduled_payments']['Update']
export type PaymentFrequency = Database['public']['Enums']['payment_frequency']
export type PaymentStatus = Database['public']['Enums']['payment_status']