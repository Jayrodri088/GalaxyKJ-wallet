"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Trash2, Calendar, Coins, User, AlertCircle, Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useScheduledPayments } from "@/hooks/use-scheduled-payments"
import { useWalletStore } from "@/store/wallet-store"

export function ScheduledPaymentsList() {
  const publicKey = useWalletStore((state) => state.publicKey)
  const { 
    payments, 
    activePayments, 
    loading, 
    error, 
    cancelPayment, 
    refreshPayments 
  } = useScheduledPayments(publicKey)

  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-800">Pendiente</Badge>
      case 'executed':
        return <Badge className="bg-green-900/30 text-green-400 border-green-800">Ejecutado</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-900/30 text-gray-400 border-gray-800">Cancelado</Badge>
      case 'error':
        return <Badge className="bg-red-900/30 text-red-400 border-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-900/30 text-gray-400 border-gray-800">{status}</Badge>
    }
  }

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return 'Una vez'
      case 'weekly':
        return 'Semanal'
      case 'monthly':
        return 'Mensual'
      case 'yearly':
        return 'Anual'
      default:
        return frequency
    }
  }

  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm("¿Estás seguro de que quieres cancelar este pago programado?")) {
      return
    }

    setCancellingId(paymentId)
    try {
      await cancelPayment(paymentId)
    } finally {
      setCancellingId(null)
    }
  }

  const getStellarExplorerUrl = (txHash: string) => {
    const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet'
    const baseUrl = network === 'mainnet' 
      ? 'https://stellar.expert/explorer/public/tx'
      : 'https://stellar.expert/explorer/testnet/tx'
    return `${baseUrl}/${txHash}`
  }

  if (!publicKey) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">Conecta tu wallet para ver los pagos programados</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 text-purple-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-400">Cargando pagos programados...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button 
          onClick={refreshPayments}
          variant="outline"
          className="border-gray-700 bg-gray-800/50 hover:bg-gray-800"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No tienes pagos programados</p>
        <p className="text-sm text-gray-500">Crea tu primera automatización para comenzar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active payments summary */}
      {activePayments.length > 0 && (
        <Card className="bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Pagos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-2">
              Tienes {activePayments.length} pago{activePayments.length !== 1 ? 's' : ''} programado{activePayments.length !== 1 ? 's' : ''}
            </p>
            <div className="text-xs text-blue-400">
              Próximo pago: {activePayments.length > 0 && formatDate(activePayments[0].execute_at)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List of all payments */}
      <div className="space-y-3">
        {payments.map((payment) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gray-800/30 border-gray-700 hover:bg-gray-800/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                        {payment.status === 'executed' ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : payment.status === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">
                          Pago de {payment.amount} {payment.asset}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {getFrequencyText(payment.frequency)}
                        </p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="font-mono">
                          {payment.recipient.slice(0, 8)}...{payment.recipient.slice(-4)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {payment.status === 'pending' ? 'Ejecutar: ' : 
                           payment.status === 'executed' && payment.executed_at ? 'Ejecutado: ' : 
                           'Programado: '}
                          {payment.status === 'executed' && payment.executed_at 
                            ? formatDate(payment.executed_at) 
                            : formatDate(payment.execute_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Coins className="h-3 w-3" />
                        <span>{payment.amount} {payment.asset}</span>
                      </div>
                    </div>

                    {payment.memo && (
                      <div className="mt-2 text-xs text-gray-500">
                        Memo: {payment.memo}
                      </div>
                    )}

                    {/* Show transaction hash if available */}
                    {payment.tx_hash && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Transacción:</span>
                        <a
                          href={getStellarExplorerUrl(payment.tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                        >
                          {payment.tx_hash.slice(0, 8)}...{payment.tx_hash.slice(-8)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {/* Show error if available */}
                    {payment.last_error && (
                      <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                        Error: {payment.last_error}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {payment.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelPayment(payment.id)}
                        disabled={cancellingId === payment.id}
                        className="border-red-800 text-red-400 hover:bg-red-900/20 h-8 px-2"
                      >
                        {cancellingId === payment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Refresh button */}
      <div className="text-center pt-4">
        <Button
          onClick={refreshPayments}
          variant="outline"
          size="sm"
          className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
        >
          Actualizar lista
        </Button>
      </div>
    </div>
  )
}