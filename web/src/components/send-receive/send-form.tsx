// components/send-form.tsx
"use client";

import { useState, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateStellarAddress } from "@/lib/stellar/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Clipboard,
  QrCode,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { useStellarPayment } from "@/hooks/use-stellar-payments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SOURCE_SECRET =
  "SC65LNVENQQ3YRMFDGKE7KLFRBNDPZIH6S3APFIKUNOYFKDY3RPVL6M7";

export function SendForm() {
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("XLM");
  const [percentageSelected, setPercentageSelected] = useState<number | null>(
    null
  );
  const [estimatedFee, setEstimatedFee] = useState<string>();
  const [estimatedTime, setEstimatedTime] = useState<string>();
  const [modalTitle, setModalTitle] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [show, setShow] = useState(false);
  const [addressValidation, setAddressValidation] = useState<{ isValid: boolean; error?: string; type?: string } | null>(null);

  const { sendXLM, loading, txResult, estimations } =
    useStellarPayment(SOURCE_SECRET);

  // Fetch estimates on mount
  useEffect(() => {
    const fetchEstimations = async () => {
      const result = await estimations();
      if ("estimatedFee" in result) {
        setEstimatedFee(result.estimatedFee);
        setEstimatedTime(result.estimatedTime + " sec");
      }
    };
    fetchEstimations();
  }, [estimations]);

  // Show result modal when txResult changes
  useEffect(() => {
    if (txResult) {
      if (txResult.success) {
        setModalTitle("Transaction Successful");

        setIsSuccess(true);
      } else if (txResult.error) {
        setModalTitle("Transaction Failed");

        setIsSuccess(false);
      }
      setShow(true);
    }
  }, [txResult]);

  const tokens = [
    { symbol: "XLM", name: "Stellar Lumens", balance: 1250.75 },
    { symbol: "USDC", name: "USD Coin", balance: 350.0 },
    { symbol: "BTC", name: "Bitcoin", balance: 0.0045 },
    { symbol: "ETH", name: "Ethereum", balance: 0.12 },
  ];

  const selectedTokenData =
    tokens.find((t) => t.symbol === selectedToken) || tokens[0];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text);
      toast({
        title: "Address pasted",
        description: "Stellar address has been pasted from clipboard",
      });
    } catch {
      toast({
        title: "Could not access clipboard",
        description: "Please paste the address manually",
      });
    }
  };

  const handleScanQR = () => {
    toast({
      title: "QR Scanner",
      description: "QR scanner would open here",
    });
  };

  const handlePercentageSelect = (percentage: number) => {
    setPercentageSelected(percentage);
    const calculatedAmount = (
      (selectedTokenData.balance * percentage) /
      100
    ).toFixed(selectedToken === "XLM" || selectedToken === "USDC" ? 2 : 6);
    setAmount(calculatedAmount);
  };

  const handleSend = async () => {
    toast({
      title: "Transaction initiated",
      description: `Sending ${amount} ${selectedToken} to ${address.substring(
        0,
        6
      )}...${address.substring(address.length - 4)}`,
    });

    await sendXLM({ destination: address, amount });

    if (txResult?.success) {
      toast({
        title: "Success!",
        description: `Transaction sent. Hash: ${txResult.hash}`,
      });
      setAddress("");
      setAmount("");
      setPercentageSelected(null);
    } else if (txResult?.error) {
      toast({
        title: "Transaction Failed",
        description: txResult.error,
      });
    }
  };

  useEffect(() => {
    if (address.trim()) {
      const validation = validateStellarAddress(address);
      setAddressValidation(validation);
    } else {
      setAddressValidation(null);
    }
  }, [address]);

  const isValidForm =
    address.length > 0 && 
    amount.length > 0 && 
    Number(amount) > 0 && 
    addressValidation?.isValid === true;

  return (
    <CardContent className="p-6">
      <div className="space-y-6">
        {/* Recipient Address */}
        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-gray-300 text-sm">
            Recipient Address
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="recipient"
                placeholder="G..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`bg-[#0A0B1E]/50 text-white pr-10 ${
                  addressValidation?.isValid === false
                    ? "border-red-500 focus:border-red-400"
                    : addressValidation?.isValid === true
                    ? "border-green-500 focus:border-green-400"
                    : "border-[#1F2037] focus:border-[#7C3AED]"
                }`}
              />
              {address && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setAddress("")}
                >
                  ×
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePaste}
              className="bg-[#0A0B1E]/50 border-[#1F2037] hover:bg-[#1F2037] hover:border-[#2F3057]"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleScanQR}
              className="bg-[#0A0B1E]/50 border-[#1F2037] hover:bg-[#1F2037] hover:border-[#2F3057]"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
          {addressValidation && !addressValidation.isValid && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {addressValidation.error}
            </div>
          )}
          {addressValidation?.isValid && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Valid Stellar {addressValidation.type === 'muxed_account' ? 'muxed account' : 'address'}
            </div>
          )}
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <Label htmlFor="token" className="text-gray-300 text-sm">
            Select Asset
          </Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger
              id="token"
              className="bg-[#0A0B1E]/50 border-[#1F2037] focus:border-[#7C3AED] text-white"
            >
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent className="bg-[#12132A] border-[#1F2037] text-white">
              {tokens.map((token) => (
                <SelectItem
                  key={token.symbol}
                  value={token.symbol}
                  className="focus:bg-[#1F2037]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                      {token.symbol.substring(0, 2)}
                    </div>
                    <span>
                      {token.symbol}{" "}
                      <span className="text-gray-400 text-xs">
                        Balance:{" "}
                        {token.balance.toFixed(token.balance < 1 ? 4 : 2)}
                      </span>
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount" className="text-gray-300 text-sm">
              Amount
            </Label>
            <span className="text-sm text-gray-400">
              Available:{" "}
              {selectedTokenData.balance.toFixed(
                selectedTokenData.balance < 1 ? 4 : 2
              )}{" "}
              {selectedToken}
            </span>
          </div>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setPercentageSelected(null);
              }}
              className="bg-[#0A0B1E]/50 border-[#1F2037] focus:border-[#7C3AED] text-white pr-16"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {selectedToken}
            </div>
          </div>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percentage) => (
              <Button
                key={percentage}
                variant="outline"
                size="sm"
                className={`flex-1 text-sm ${
                  percentageSelected === percentage
                    ? "bg-[#7C3AED]/20 border-[#7C3AED] text-white"
                    : "bg-[#0A0B1E]/50 border-[#1F2037] text-gray-400 hover:bg-[#1F2037]"
                }`}
                onClick={() => handlePercentageSelect(percentage)}
              >
                {percentage}%
              </Button>
            ))}
          </div>
        </div>

        {/* Network Fee & Processing Time */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center text-gray-400">
            <div className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Network Fee</span>
            </div>
            <span>{estimatedFee} XLM</span>
          </div>

          <div className="flex justify-between items-center text-gray-400">
            <div className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Processing Time</span>
            </div>
            <span>~{estimatedTime}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#1F2037]">
            <span className="text-gray-300">Total Amount</span>
            <div className="text-white">
              {amount
                ? (
                    Number(amount) +
                    (selectedToken === "XLM" ? Number(estimatedFee) : 0)
                  ).toFixed(6)
                : "0.00"}{" "}
              {selectedToken}
            </div>
          </div>
        </div>

        <Button
          className={`w-full h-11 text-sm font-medium flex items-center justify-center gap-2 ${
            isValidForm && !loading
              ? "bg-[#7C3AED] hover:bg-[#6D31D9] text-white"
              : "bg-[#1F2037] text-gray-400 cursor-not-allowed"
          }`}
          disabled={!isValidForm || loading}
          onClick={handleSend}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send {selectedToken}
            </>
          )}
        </Button>

        {/* Warning */}
        <div className="flex items-start gap-2 text-xs text-yellow-500/90 bg-yellow-500/5 rounded-md p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Always double-check the recipient address before sending.
            Transactions on the Stellar network are irreversible.
          </p>
        </div>
      </div>

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md bg-[#12132A] border-[#1F2037]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <span className={isSuccess ? "text-green-500" : "text-red-500"}>
                {modalTitle}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-gray-300">
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShow(false)}
                className={`${
                  isSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}
