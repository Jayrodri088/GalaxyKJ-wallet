import { supabase } from './supabase-client'
import CryptoJS from 'crypto-js'
import type { Database } from './supabase-types'

type ScheduledPayment = Database['public']['Tables']['scheduled_payments']['Row']
type ScheduledPaymentInsert = Database['public']['Tables']['scheduled_payments']['Insert']
type ScheduledPaymentUpdate = Database['public']['Tables']['scheduled_payments']['Update']

// Encryption key - in production should come from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'galaxy-wallet-secret-key'

export class ScheduledPaymentsService {
  // Encrypt the secret key
  private static encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString()
  }

  // Decrypt the secret key
  private static decryptSecret(encryptedSecret: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      if (!decrypted) {
        throw new Error('Failed to decrypt secret')
      }
      return decrypted
    } catch (error) {
      console.error('Error decrypting secret:', error)
      throw new Error('Invalid encrypted secret')
    }
  }

  // Create a new scheduled payment
  static async createScheduledPayment(payment: {
    userId: string
    publicKey: string
    secretKey: string
    recipient: string
    asset: string
    amount: number
    memo?: string
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
    executeAt: Date
  }): Promise<ScheduledPayment | null> {
    try {
      const encryptedSecret = this.encryptSecret(payment.secretKey)
      
      // Truncate memo to 28 bytes
      const truncatedMemo = payment.memo ? 
        payment.memo.substring(0, 28) : null
      
      const paymentData: ScheduledPaymentInsert = {
        user_id: payment.userId,
        public_key: payment.publicKey,
        encrypted_secret: encryptedSecret,
        recipient: payment.recipient,
        asset: payment.asset,
        amount: payment.amount,
        memo: truncatedMemo,
        frequency: payment.frequency,
        execute_at: payment.executeAt.toISOString(),
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('scheduled_payments')
        .insert(paymentData)
        .select()
        .single()

      if (error) {
        console.error('Error creating scheduled payment:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createScheduledPayment:', error)
      return null
    }
  }

  // Get scheduled payments for a user
  static async getUserScheduledPayments(userId: string): Promise<ScheduledPayment[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching scheduled payments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserScheduledPayments:', error)
      return []
    }
  }

  // Get active payments (pending)
  static async getActiveScheduledPayments(userId: string): Promise<ScheduledPayment[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('execute_at', { ascending: true })

      if (error) {
        console.error('Error fetching active scheduled payments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getActiveScheduledPayments:', error)
      return []
    }
  }

  // Cancel a scheduled payment
  static async cancelScheduledPayment(paymentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_payments')
        .update({ status: 'cancelled' })
        .eq('id', paymentId)
        .eq('status', 'pending') // Only cancel if it's pending

      if (error) {
        console.error('Error cancelling scheduled payment:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in cancelScheduledPayment:', error)
      return false
    }
  }

  // Update payment status
  static async updatePaymentStatus(
    paymentId: string, 
    status: 'pending' | 'executed' | 'cancelled' | 'error',
    txHash?: string,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: ScheduledPaymentUpdate = { status }
      
      if (status === 'executed') {
        updateData.executed_at = new Date().toISOString()
        if (txHash) updateData.tx_hash = txHash
      }
      
      if (status === 'error' && errorMessage) {
        updateData.last_error = errorMessage
      }

      const { error } = await supabase
        .from('scheduled_payments')
        .update(updateData)
        .eq('id', paymentId)

      if (error) {
        console.error('Error updating payment status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error)
      return false
    }
  }

  // Get payments ready to execute (for backend)
  static async getPaymentsToExecute(): Promise<ScheduledPayment[]> {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('scheduled_payments')
        .select('*')
        .eq('status', 'pending')
        .lte('execute_at', now)

      if (error) {
        console.error('Error fetching payments to execute:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPaymentsToExecute:', error)
      return []
    }
  }

  // Decrypt secret key (for backend use)
  static decryptPaymentSecret(encryptedSecret: string): string {
    return this.decryptSecret(encryptedSecret)
  }
}