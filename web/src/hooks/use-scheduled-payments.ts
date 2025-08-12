import { useState, useEffect, useCallback } from 'react'
import { ScheduledPaymentsService } from '@/lib/scheduled-payments'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase-types'

type ScheduledPayment = Database['public']['Tables']['scheduled_payments']['Row']

export function useScheduledPayments(publicKey?: string | null) {
  const [payments, setPayments] = useState<ScheduledPayment[]>([])
  const [activePayments, setActivePayments] = useState<ScheduledPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  // Load all user payments - using useCallback to prevent infinite re-renders
  const loadPayments = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const [allPayments, activePayments] = await Promise.all([
        ScheduledPaymentsService.getUserScheduledPayments(userId),
        ScheduledPaymentsService.getActiveScheduledPayments(userId)
      ])

      // If publicKey is provided and not null, filter only payments from that wallet
      let filteredPayments = allPayments
      let filteredActivePayments = activePayments

      if (publicKey) {
        filteredPayments = allPayments.filter(payment => payment.public_key === publicKey)
        filteredActivePayments = activePayments.filter(payment => payment.public_key === publicKey)
      }

      setPayments(filteredPayments)
      setActivePayments(filteredActivePayments)
    } catch (err) {
      setError('Error al cargar los pagos programados')
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, publicKey])

  // Create a new scheduled payment
  const createPayment = async (paymentData: {
    publicKey: string
    secretKey: string
    recipient: string
    asset: string
    amount: number
    memo?: string
    frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
    executeAt: Date
  }) => {
    if (!userId) {
      setError('Usuario no autenticado')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const newPayment = await ScheduledPaymentsService.createScheduledPayment({
        userId: userId, // Use userId from Supabase Auth
        ...paymentData
      })

      if (newPayment) {
        await loadPayments() // Reload the list
        return newPayment
      } else {
        setError('Error al crear el pago programado')
        return null
      }
    } catch (err) {
      setError('Error al crear el pago programado')
      console.error('Error creating payment:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Cancel a scheduled payment
  const cancelPayment = async (paymentId: string) => {
    setLoading(true)
    setError(null)

    try {
      const success = await ScheduledPaymentsService.cancelScheduledPayment(paymentId)
      
      if (success) {
        await loadPayments() // Reload the list
        return true
      } else {
        setError('Error al cancelar el pago programado')
        return false
      }
    } catch (err) {
      setError('Error al cancelar el pago programado')
      console.error('Error cancelling payment:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Load payments when component mounts or userId/publicKey changes
  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  return {
    payments,
    activePayments,
    loading,
    error,
    userId,
    publicKey,
    createPayment,
    cancelPayment,
    refreshPayments: loadPayments
  }
}