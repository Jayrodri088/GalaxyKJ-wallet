import { Suspense } from "react"
import { SendReceiveScreen } from "@/components/send-receive/send-receive-screen"

export default function SendReceivePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="min-h-screen bg-[#0A0B1E] flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
        <SendReceiveScreen />
      </Suspense>
    </main>
  )
}