"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, RefreshCw, Zap, ChevronRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FinancialImpactChart } from "@/components/automation/financial-impact-chart"
import { Badge } from "@/components/ui/badge"
import type { Automation } from "@/types/automation"

interface NewAutomationFormProps {
  automation?: Automation | null
  isEditing?: boolean
  onSubmit: (automation: Automation) => void
  onCancel: () => void
}

export function NewAutomationForm({
  automation = null,
  isEditing = false,
  onSubmit,
  onCancel,
}: NewAutomationFormProps) {

  const [step, setStep] = useState(isEditing ? 2 : 1)
  const [automationType, setAutomationType] = useState(isEditing && automation ? automation.type : "payment")
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
  };
  


  const handleSubmit = () => {

    let description = ""
    if (formData.type === "payment") {
      description = `Send ${formData.amount} ${formData.asset} ${
        formData.frequency === "once" ? "once" : formData.frequency === "weekly" ? "every week" : formData.frequency === "monthly" ? "every month" : formData.frequency === "yearly" ? "every year" : "periodically"
      } to ${formData.recipient}`
    } else if (formData.type === "swap") {
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


    let nextExecution = null
    if (formData.type === "payment") {
      const now = new Date()
      if (formData.frequency === "once") {
        nextExecution = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day from now
      } else if (formData.frequency === "weekly") {
        nextExecution = new Date(now.setDate(now.getDate() + 7))
      } else if (formData.frequency === "monthly") {
        nextExecution = new Date(now.setMonth(now.getMonth() + 1))
      } else if (formData.frequency === "yearly") {
        nextExecution = new Date(now.setFullYear(now.getFullYear() + 1))
      }
    }

    const updatedData: Automation = {
      ...formData,
      description,
      nextExecution: nextExecution ? nextExecution.toISOString() : undefined,
    }

    onSubmit(updatedData)
  }

  const isStepValid = () => {
    if (step === 1) {
      return formData.name.trim() !== ""
    } else if (step === 2) {
      if (formData.type === "payment") {
        return formData.recipient && formData.amount && formData.asset && formData.frequency
      } else if (formData.type === "swap") {
        return (
          formData.assetFrom && formData.assetTo && formData.amountFrom && formData.condition && formData.conditionValue
        )
      } else if (formData.type === "rule") {
        return formData.asset && formData.threshold && formData.action
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


      {!isEditing && step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="automation-name">Automation Name</Label>
              <Input
                id="automation-name"
                placeholder="Ex: Monthly rent payment"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label>Automation Type</Label>
              <Tabs defaultValue="payment" value={automationType} onValueChange={(value) => handleTypeChange(value as "payment" | "swap" | "rule")} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                  <TabsTrigger value="payment" className="data-[state=active]:bg-blue-900/50">
                    <Clock className="h-4 w-4 mr-2" />
                    Payment
                  </TabsTrigger>
                  <TabsTrigger value="swap" className="data-[state=active]:bg-purple-900/50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Swap
                  </TabsTrigger>
                  <TabsTrigger value="rule" className="data-[state=active]:bg-yellow-900/50">
                    <Zap className="h-4 w-4 mr-2" />
                    Rule
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="payment" className="mt-4">
                  <div className="text-sm text-gray-400">
                    Schedule recurring payments to specific addresses with the frequency you choose.
                  </div>
                </TabsContent>
                <TabsContent value="swap" className="mt-4">
                  <div className="text-sm text-gray-400">
                    Set up automatic swaps between assets based on price conditions.
                  </div>
                </TabsContent>
                <TabsContent value="rule" className="mt-4">
                  <div className="text-sm text-gray-400">
                    Create smart rules that trigger when certain conditions are met.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      )}


      {(step === 2 || isEditing) && (
        <motion.div
          initial={{ opacity: 0, x: isEditing ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
 
          {isEditing && (
            <div className="space-y-2 mb-6">
              <Label htmlFor="automation-name">Automation Name</Label>
              <Input
                id="automation-name"
                placeholder="Ex: Monthly rent payment"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
              />
            </div>
          )}


          {isEditing && (
            <div className="mb-6">
              <Label className="mb-2 block">Automation Type</Label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  {formData.type === "payment" ? (
                    <Clock className="h-4 w-4 text-blue-400" />
                  ) : formData.type === "swap" ? (
                    <RefreshCw className="h-4 w-4 text-purple-400" />
                  ) : (
                    <Zap className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    formData.type === "payment"
                      ? "bg-blue-900/30 text-blue-400 border-blue-800"
                      : formData.type === "swap"
                        ? "bg-purple-900/30 text-purple-400 border-purple-800"
                        : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                  }`}
                >
                  {formData.type === "payment" ? "Payment" : formData.type === "swap" ? "Swap" : "Rule"}
                </Badge>
                <span className="text-sm text-gray-400 ml-2">(Type cannot be changed when editing)</span>
              </div>
            </div>
          )}

          {formData.type === "payment" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
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
                  <Label htmlFor="asset">Asset</Label>
                  <Select value={formData.asset} onValueChange={(value) => handleInputChange("asset", value)}>
                    <SelectTrigger id="asset" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                      <SelectValue placeholder="Select asset" />
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
                  <Label htmlFor="amount">Amount</Label>
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
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleInputChange("frequency", value as "daily" | "weekly" | "monthly")}
                >
                  <SelectTrigger id="frequency" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Memo (Optional)</Label>
                <Input
                  id="memo"
                  placeholder="Add a note to the transaction"
                  value={formData.memo || ""}
                  onChange={(e) => handleInputChange("memo", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {formData.type === "swap" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetFrom">From</Label>
                  <Select value={formData.assetFrom} onValueChange={(value) => handleInputChange("assetFrom", value)}>
                    <SelectTrigger id="assetFrom" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                      <SelectValue placeholder="Select asset" />
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
                  <Label htmlFor="assetTo">To</Label>
                  <Select value={formData.assetTo} onValueChange={(value) => handleInputChange("assetTo", value)}>
                    <SelectTrigger id="assetTo" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="XLM">XLM</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountFrom">Amount to Convert</Label>
                <Input
                  id="amountFrom"
                  type="number"
                  placeholder="0.00"
                  value={formData.amountFrom}
                  onChange={(e) => handleInputChange("amountFrom", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    handleInputChange("condition", value as "price_increase" | "price_decrease" | "price_target")
                  }
                >
                  <SelectTrigger id="condition" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="price_increase">When the price increases</SelectItem>
                    <SelectItem value="price_decrease">When the price decreases</SelectItem>
                    <SelectItem value="price_target">When the price reaches</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditionValue">Condition Value</Label>
                <div className="relative">
                  <Input
                    id="conditionValue"
                    type="number"
                    placeholder={formData.condition === "price_target" ? "0.00" : "5"}
                    value={formData.conditionValue}
                    onChange={(e) => handleInputChange("conditionValue", e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {formData.condition === "price_target" ? "USDC" : "%"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.type === "rule" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Asset</Label>
                <Select value={formData.asset} onValueChange={(value) => handleInputChange("asset", value)}>
                  <SelectTrigger id="asset" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                    <SelectValue placeholder="Select asset" />
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
                <Label>Threshold Type</Label>
                <RadioGroup defaultValue="balance" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="balance" id="balance" className="text-purple-600" />
                    <Label htmlFor="balance" className="text-sm">
                      Balance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price" id="price" className="text-purple-600" />
                    <Label htmlFor="price" className="text-sm">
                      Price
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Value</Label>
                <Input
                  id="threshold"
                  type="number"
                  placeholder="100"
                  value={formData.threshold}
                  onChange={(e) => handleInputChange("threshold", e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={formData.action}
                  onValueChange={(value) => handleInputChange("action", value as "alert" | "buy" | "sell" | "custom")}
                >
                  <SelectTrigger id="action" className="bg-gray-800/50 border-gray-700 focus:border-purple-500">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="alert">Send alert</SelectItem>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="custom">Custom action</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.action === "buy" || formData.action === "sell") && (
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}


      {!isEditing && step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Review Automation</h3>
              <p className="text-sm text-gray-400">Verify the details of your automation before creating it.</p>
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
                  <p className="text-sm text-gray-400">
                    {formData.type === "payment" &&
                      `Send ${formData.amount} ${formData.asset} ${
                        formData.frequency === "once"
                          ? "once"
                          : formData.frequency === "weekly"
                            ? "every week"
                            : formData.frequency === "monthly"
                              ? "every month"
                              : formData.frequency === "yearly"
                                ? "every year"
                                : "periodically"
                      } to ${formData.recipient}`}
                    {formData.type === "swap" &&
                      `Convert ${formData.amountFrom} ${formData.assetFrom} to ${formData.assetTo} when ${
                        formData.condition === "price_increase"
                          ? `the price increases by ${formData.conditionValue}%`
                          : formData.condition === "price_decrease"
                            ? `the price decreases by ${formData.conditionValue}%`
                            : `the price reaches ${formData.conditionValue} USDC`
                      }`}
                    {formData.type === "rule" &&
                      `If the balance ${
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
                      }`}
                  </p>
                </div>
              </div>

              <div className="h-40 bg-gray-800/30 rounded-lg p-2">
                <FinancialImpactChart automation={formData} />
              </div>

              {formData.type === "payment" && (
                <div className="flex items-center gap-2 text-xs text-yellow-500/90 bg-yellow-500/5 rounded-md p-3">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>
                    This automation will use approximately{" "}
                    {formData.frequency === "once"
                      ? Number(formData.amount)
                      : formData.frequency === "weekly"
                        ? Number(formData.amount) * 52
                        : formData.frequency === "monthly"
                          ? Number(formData.amount) * 12
                          : formData.frequency === "yearly"
                            ? Number(formData.amount)
                            : Number(formData.amount) * 12}{" "}
                    {formData.asset} per year.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}


      <div className="flex justify-between pt-4 border-t border-gray-800">
        {isEditing || step > 1 ? (
          <Button
            variant="outline"
            onClick={isEditing ? onCancel : handleBack}
            className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
          >
            {isEditing ? "Cancel" : "Back"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
          >
            Cancel
          </Button>
        )}

        {!isEditing && step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED]"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED]"
          >
            {isEditing ? "Save Changes" : "Create Automation"}
          </Button>
        )}
      </div>
    </div>
  )
}