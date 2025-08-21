import { Wallet } from "@/components/dashboard/wallet"
import { OfflineIndicator } from "@/components/ui/offline-indicator"

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <OfflineIndicator variant="banner" />
      <Wallet />
    </main>
  )
}

