"use client";

import { useState, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Check, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReceiveForm() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedToken, setSelectedToken] = useState("XLM");
  const qrRef = useRef<HTMLDivElement>(null);

  const stellarAddress = "GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
  const shortAddress = `${stellarAddress.substring(0, 8)}...${stellarAddress.substring(stellarAddress.length - 8)}`;

  const tokens = [
    { symbol: "XLM", name: "Stellar Lumens", balance: 1250.75, icon: "🌟" },
    { symbol: "USDC", name: "USD Coin", balance: 350.0, icon: "💵" },
    { symbol: "BTC", name: "Bitcoin", balance: 0.0045, icon: "₿" },
    { symbol: "ETH", name: "Ethereum", balance: 0.12, icon: "Ξ" },
  ];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(stellarAddress);
    setCopied(true);
    toast({
      title: "Address copied",
      description: "Stellar address has been copied to clipboard",
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "My Stellar Address",
          text: `Here's my Stellar address: ${stellarAddress}`,
        })
        .catch(() => {
          toast({
            title: "Error sharing",
            description: "Could not share address",
          });
        });
    } else {
      toast({
        title: "Share not supported",
        description: "Your browser doesn't support the Web Share API",
      });
    }
  };

  return (
    <CardContent className="p-6 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4F46E5]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      <div className="space-y-6 relative z-10">
        <div className="text-gray-400 text-sm text-center">{shortAddress}</div>

        <div className="flex flex-col items-center">
          <div ref={qrRef} className="w-64 h-64 bg-white p-4 rounded-lg mb-4 shadow-lg"></div>

          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleCopyAddress} className={copied ? "bg-green-500" : ""}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#E5E7EB]">Your Stellar Address</Label>
          <div className="flex gap-2">
            <Input readOnly value={stellarAddress} className="bg-gray-800 text-white pr-10" />
            <Button variant="outline" size="icon" onClick={handleCopyAddress}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Current Balance</h3>
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.symbol} className="flex justify-between items-center p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">{token.icon}</div>
                  <span>{token.symbol}</span>
                </div>
                <span className="font-medium">{token.balance.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#9333EA] hover:from-[#4F46E5] hover:to-[#7C3AED] shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Payment Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Create Payment Request</DialogTitle>
              <DialogDescription>Generate a payment request to share with others.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="request-token">Select Asset</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger id="request-token" className="bg-gray-800 text-white">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    {tokens.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <span>{token.icon}</span>
                          <span>{token.symbol}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-amount">Amount</Label>
                <Input id="request-amount" type="number" placeholder="0.00" className="bg-gray-800 text-white pr-16" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-memo">Memo (Optional)</Label>
                <Input id="request-memo" placeholder="Payment for..." className="bg-gray-800 text-white" />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Generate Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CardContent>
  );
}
