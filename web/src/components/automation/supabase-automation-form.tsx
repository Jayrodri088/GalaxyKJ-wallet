"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, RefreshCw, Zap, ChevronRight, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useScheduledPayments } from "@/hooks/use-scheduled-payments"
import { useWalletStore } from "@/store/wallet-store"
import type { Automation } from "@/types/automation"

interface SupabaseAutomationFormProps {
  automation?: Automation | null
  isEditing?: boolean
  onSubmit: (automation: Automation) => void
  onCancel: () => void
}

export function SupabaseAutomationForm({
  automation = null,
  isEditing = false,
  onSubmit,
  onCancel,
}: SupabaseAutomationFormProps) {
  const [step, setStep] = useState(isEditing ? 2 : 1)
  const [automationType, setAutomationType] = useState(isEditing && automation ? automation.type : "payment")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [secretKey, setSecretKey] = useState("")
  const [showSecretKey, setShowSecretKey] = useState(false)
  
  // Hooks to handle wallet and scheduled payments
  const publicKey = useWalletStore((state) => state.publicKey)
  const { createPayment, error: paymentError } = useScheduledPayments(publicKey)

  const [formData, setFormData] = useState<Automation>(
    isEditing && automation
      ? { ...automation }
      : {
          type: "payment", 
          name: "",
          description: "",
          recipient: "",
          asset: "XLM",
          amount: "",
          frequency: "monthly",
          memo: "",
          assetFrom: "XLM",
          assetTo: "USDC",
          amountFrom: "",
          condition: "price_increase",
          conditionValue: "",
          threshold: "",
          action: "alert",
          active: true,
          createdAt: new Date().toISOString(),
          executionCount: 0,
        }
  );

  const handleInputChange = (field: keyof Automation, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleTypeChange = (value: "payment" | "swap" | "rule") => {
    setAutomationType(value);
    setFormData({
      ...formData,
      type: value,
    });
  };

  const calculateNextExecution = (frequency: string): Date => {
    const now = new Date()
    switch (frequency) {
      case "daily":
        return new Date(now.setDate(now.getDate() + 1))
      case "weekly":
        return new Date(now.setDate(now.getDate() + 7))
      case "monthly":
        return new Date(now.setMonth(now.getMonth() + 1))
      case "yearly":
        return new Date(now.setFullYear(now.getFullYear() + 1))
      default:
        return new Date(now.setMonth(now.getMonth() + 1))
    }
  }

  const handleSubmit = async () => {
    if (!publicKey) {
      alert("No hay una wallet conectada")
      return
    }

    if (formData.type === "payment" && !secretKey) {
      alert("La clave secreta es requerida para pagos programados")
      return
    }

    setIsSubmitting(true)

    try {
      // Only handle scheduled payments for now
      if (formData.type === "payment") {
        // Validate required fields
        if (!formData.recipient || !formData.asset || !formData.amount) {
          alert("Por favor completa todos los campos requeridos")
          return
        }

        const nextExecution = calculateNextExecution(formData.frequency || "monthly")
        
        const paymentData = {
          publicKey: publicKey,
          secretKey: secretKey, // Will be encrypted in the service
          recipient: formData.recipient,
          asset: formData.asset,
          amount: Number(formData.amount),
          memo: formData.memo,
          frequency: (formData.frequency || "monthly") as 'once' | 'weekly' | 'monthly' | 'yearly',
          executeAt: nextExecution
        }

        const result = await createPayment(paymentData)
        
        if (result) {
          // Clear the secret key from state
          setSecretKey("")
          
          // Create local automation for UI
          const description = `Send ${formData.amount} ${formData.asset} ${
            formData.frequency === "once" ? "once" :
            formData.frequency === "weekly" ? "every week" : 
            formData.frequency === "monthly" ? "every month" : "every year"
          } to ${formData.recipient}`

          const updatedData: Automation = {
            ...formData,
            id: result.id,
            description,
            nextExecution: nextExecution.toISOString(),
          }

          onSubmit(updatedData)
        } else {
          alert("Error al crear el pago programado")
        }
      } else {
        // For swaps and rules, use original logic for now
        let description = ""
        if (formData.type === "swap") {
          description = `Convert ${formData.amountFrom} ${formData.assetFrom} to ${formData.assetTo} when ${
            formData.condition === "price_increase"
              ? `the price increases by ${formData.conditionValue}%`
              : formData.condition === "price_decrease"
                ? `the price decreases by ${formData.conditionValue}%`
                : `the price reaches ${formData.conditionValue} USDC`
          }`
        } else if (formData.type === "rule") {
          description = `If the balance ${
            typeof formData.threshold === "number" && formData.threshold < 0
              ? `falls more than ${Math.abs(formData.threshold)}%`
              : `falls below ${formData.threshold} ${formData.asset}`
          }, ${
            formData.action === "alert"
              ? "receive alert"
              : formData.action === "buy"
                ? `buy ${formData.amount} ${formData.asset}`
                : formData.action === "sell"
                  ? `sell ${formData.amount} ${formData.asset}`
                  : "execute custom action"
          }`
        }

        const updatedData: Automation = {
          ...formData,
          description,
        }

        onSubmit(updatedData)
      }
    } catch (error) {
      console.error("Error al crear automatización:", error)
      alert("Error al crear la automatización")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    if (step === 1) {
      return formData.name.trim() !== ""
    }
    
    if (step === 2) {
      if (formData.type === "payment") {
        return (
          formData.recipient?.trim() !== "" &&
          formData.asset?.trim() !== "" &&
          String(formData.amount || "").trim() !== "" &&
          !isNaN(Number(formData.amount)) &&
          Number(formData.amount) > 0 &&
          secretKey.trim() !== ""
        )
      } else if (formData.type === "swap") {
        return (
          formData.assetFrom?.trim() !== "" &&
          formData.assetTo?.trim() !== "" &&
          String(formData.amountFrom || "").trim() !== "" &&
          !isNaN(Number(formData.amountFrom)) &&
          Number(formData.amountFrom) > 0 &&
          formData.condition?.trim() !== "" &&
          String(formData.conditionValue || "").trim() !== ""
        )
      } else if (formData.type === "rule") {
        return (
          formData.asset?.trim() !== "" &&
          String(formData.threshold || "").trim() !== "" &&
          formData.action?.trim() !== ""
        )
      }
    }
    
    return true
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleNext = () => {
    setStep(step + 1)
  }

  return (
    <div className="space-y-6">
      {/* Show errors if any */}
      {paymentError && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
          {paymentError}
        </div>
      )}

      {/* Step indicator */}
      {!isEditing && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? "bg-purple-600" : "bg-gray-800"}`}></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? "bg-purple-600" : "bg-gray-800"}`}></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400"
              }`}
            >
              3
            </div>
          </div>
          <div className="text-sm text-gray-400">Step {step} of 3</div>
        </div>
      )}

      {/* Step 1: Name and type */}
      {!isEditing && step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="automation-name">Nombre de la Automatización</Label>
              <Input
                id="automation-name"
                placeholder="Ej: Pago mensual de renta"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Automatización</Label>
              <Tabs defaultValue="payment" value={automationType} onValueChange={(value) => handleTypeChange(value as "payment" | "swap" | "rule")} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                  <TabsTrigger value="payment" className="data-[state=active]:bg-blue-900/50">
                    <Clock className="h-4 w-4 mr-2" />
                    Pago
                  </TabsTrigger>
                  <TabsTrigger value="swap" className="data-[state=active]:bg-purple-900/50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Intercambio
                  </TabsTrigger>
                  <TabsTrigger value="rule" className="data-[state=active]:bg-yellow-900/50">
                    <Zap className="h-4 w-4 mr-2" />
                    Regla
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="payment" className="mt-4">
                  <div className="text-sm text-gray-400">
                    Programa pagos recurrentes a direcciones específicas con la frecuencia que elijas.
                  </div>
                </TabsContent>
                <TabsContent value="swap" className="mt-4">
                  <div className="text-sm text-gray-400">
                    Configura intercambios automáticos entre activos basados en condiciones de precio.
                  </div>
                </TabsContent>
                <TabsContent value="rule" className="mt-4">
                  <div className="text-sm text-gray-400">
                    Crea reglas inteligentes que se activen cuando se cumplan ciertas condiciones.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Configuration */}
      {(step === 2 || isEditing) && (
        <motion.div
          initial={{ opacity: 0, x: isEditing ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Payment form */}
          {formData.type === "payment" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Dirección del destinatario</Label>
                <Input
                  id="recipient"
                  placeholder="G..."
                  value={formData.recipient}
                  onChange={(e) => handleInputChange("recipient", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset">Activo</Label>
                  <Select value={formData.asset} onValueChange={(value) => handleInputChange("asset", value)}>
                    <SelectTrigger id="asset" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                      <SelectValue placeholder="Seleccionar activo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="XLM">XLM</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Cantidad</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleInputChange("frequency", value as "daily" | "weekly" | "monthly" | "yearly")}
                >
                  <SelectTrigger id="frequency" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Memo (Opcional)</Label>
                <Input
                  id="memo"
                  placeholder="Agregar una nota a la transacción"
                  value={formData.memo || ""}
                  onChange={(e) => handleInputChange("memo", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>

              {/* Secret key field */}
              <div className="space-y-2">
                <Label htmlFor="secretKey">Clave Secreta del Wallet</Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="S..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Tu clave secreta se encriptará y almacenará de forma segura en Supabase.
                </p>
              </div>

              {/* Supabase warning */}
              <div className="flex items-center gap-2 text-xs text-blue-500/90 bg-blue-500/5 rounded-md p-3">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p>
                  Este pago se almacenará de forma segura en Supabase y se ejecutará automáticamente en las fechas programadas.
                </p>
              </div>
            </div>
          )}

          {/* Other automation types maintain original logic */}
          {formData.type === "swap" && (
            <div className="space-y-4">
              {/* Swap content - maintain original logic */}
              <div className="text-sm text-gray-400">
                Los intercambios automáticos aún no están integrados con Supabase. Se manejarán localmente.
              </div>
            </div>
          )}

          {formData.type === "rule" && (
            <div className="space-y-4">
              {/* Rules content - maintain original logic */}
              <div className="text-sm text-gray-400">
                Las reglas automáticas aún no están integradas con Supabase. Se manejarán localmente.
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Review */}
      {!isEditing && step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Revisar Automatización</h3>
              <p className="text-sm text-gray-400">Verifica los detalles de tu automatización antes de crearla.</p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  {formData.type === "payment" ? (
                    <Clock className="h-5 w-5 text-blue-400" />
                  ) : formData.type === "swap" ? (
                    <RefreshCw className="h-5 w-5 text-purple-400" />
                  ) : (
                    <Zap className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{formData.name}</h4>
                  <p>
                    Esta automatización usará aproximadamente{" "}
                    {formData.frequency === "once"
                      ? Number(formData.amount)
                      : formData.frequency === "weekly"
                        ? Number(formData.amount) * 52
                        : formData.frequency === "monthly"
                          ? Number(formData.amount) * 12
                          : Number(formData.amount)}{" "}
                    {formData.asset} {formData.frequency === "once" ? "en total" : "por año"}.
                  </p>
                </div>
              </div>

              {formData.type === "payment" && (
                <div className="flex items-center gap-2 text-xs text-yellow-500/90 bg-yellow-500/5 rounded-md p-3">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>
                    Esta automatización usará aproximadamente{" "}
                    {formData.frequency === "once"
                      ? Number(formData.amount)
                      : formData.frequency === "weekly"
                        ? Number(formData.amount) * 52
                        : formData.frequency === "monthly"
                          ? Number(formData.amount) * 12
                          : Number(formData.amount)}{" "}
                    {formData.asset} por año.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-800">
        {isEditing || step > 1 ? (
          <Button
            variant="outline"
            onClick={isEditing ? onCancel : handleBack}
            className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
            disabled={isSubmitting}
          >
            {isEditing ? "Cancelar" : "Atrás"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}

        {!isEditing && step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED]"
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              isEditing ? "Guardar Cambios" : "Crear Automatización"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}