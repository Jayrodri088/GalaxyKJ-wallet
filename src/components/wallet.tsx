"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send, ReceiptIcon as ReceiveIcon, Repeat, Search, Menu, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceDisplay } from "@/components/balance-display";
import { FinancialCharts } from "@/components/financial-charts";
import { TransactionHistory } from "@/components/transaction-history";
import { AiRecommendations } from "@/components/ai-recommendations";
import { SecurityOptions } from "@/components/security-options";
import { StarBackground } from "@/components/star-background";
import { useMobile } from "@/hooks/use-mobile";

export function Wallet() {
  const router = useRouter();
  const isMobile = useMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
      <StarBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold">GW</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Galaxy Wallet
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 w-64 bg-gray-900/50 border-gray-800 focus:border-purple-500 text-white"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
            >
              <HelpCircle className="h-4 w-4 text-purple-400" />
              <span>Support</span>
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {isMobile && menuOpen && (
          <div className="absolute top-20 right-4 z-50 bg-gray-900/95 border border-gray-800 rounded-lg p-4 w-64 shadow-xl backdrop-blur-sm">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 w-full bg-gray-900/50 border-gray-800 focus:border-purple-500 text-white"
              />
            </div>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
              <Button variant="ghost" className="w-full justify-start">Settings</Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2 text-purple-400" />
                Support
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BalanceDisplay />

            <div className="grid grid-cols-4 gap-4">
              <Button
                className="h-20 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                onClick={() => router.push("/send-receive?tab=send")}
              >
                <Send className="h-6 w-6" />
                <span>Send</span>
              </Button>

              <Button
                className="h-20 bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 border-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(147,51,234,0.5)]"
                onClick={() => router.push("/send-receive?tab=receive")}
              >
                <ReceiveIcon className="h-6 w-6" />
                <span>Receive</span>
              </Button>

              <Button
                className="h-20 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 border-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                onClick={() => router.push("/swap")}
              >
                <Repeat className="h-6 w-6" />
                <span>Swap</span>
              </Button>

              <Button
                className="h-20 bg-gradient-to-br from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 border-0 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                onClick={() => router.push("/automate")}
              >
                <Zap className="h-6 w-6" />
                <span>Automate</span>
              </Button>
            </div>

            <FinancialCharts />

            <TransactionHistory />
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                <TabsTrigger value="ai" className="data-[state=active]:bg-purple-900/50">AI Insights</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-purple-900/50">Security</TabsTrigger>
              </TabsList>
              <TabsContent value="ai" className="mt-4"><AiRecommendations /></TabsContent>
              <TabsContent value="security" className="mt-4"><SecurityOptions /></TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-20 md:hidden">
          <Button
            className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all duration-300"
            onClick={() => router.push("/support")}
          >
            <HelpCircle className="h-6 w-6" />
            <span className="sr-only">Support</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
