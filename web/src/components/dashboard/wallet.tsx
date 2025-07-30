"use client"

import { StarBackground } from "@/components/effects/star-background"
import { BalanceDisplay } from "@/components/dashboard/balance-display"
import { FinancialCharts } from "@/components/dashboard/financial-charts"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { WalletActions } from "@/components/dashboard/wallet-actions"
import { RightPanelTabs } from "@/components/dashboard/right-panel-tabs"
import { Header } from "@/components/layout/header/header"

export function Wallet() {
  const handleCreateWallet = () => {
    // Dashboard context - wallet creation would be handled elsewhere
    console.log("Create wallet clicked from dashboard");
  };

  const handleLogin = () => {
    // Dashboard context - login would be handled elsewhere
    console.log("Login clicked from dashboard");
  };

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
      <StarBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">
        <Header onCreateWallet={handleCreateWallet} onLogin={handleLogin} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BalanceDisplay />
            <WalletActions />
            <FinancialCharts />
            <TransactionHistory />
          </div>

          <div className="space-y-6">
            <RightPanelTabs />
          </div>
        </div>
      </div>
    </div>
  )
}
