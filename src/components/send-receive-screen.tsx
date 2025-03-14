// components/send-receive-screen.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { StarBackground } from "@/components/star-background"
import { SendForm } from "@/components/send-form"
import { ReceiveForm } from "@/components/receive-form"
import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SendReceiveScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("send")

  return (
    <div className="relative w-full min-h-screen bg-[#0A0B1E] text-white overflow-hidden">
      <StarBackground />

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/5"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center">
            <span className="text-white font-medium text-sm">GW</span>
          </div>
          <h1 className="text-lg font-medium text-white">{activeTab === "send" ? "Send Assets" : "Receive Assets"}</h1>
        </header>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="send" className="w-full" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2 bg-transparent mb-6">
              <TabsTrigger
                value="send"
                className="py-2.5 text-sm data-[state=active]:bg-[#7C3AED]/90 data-[state=active]:text-white text-gray-400 rounded-md"
              >
                Send
              </TabsTrigger>
              <TabsTrigger
                value="receive"
                className="py-2.5 text-sm data-[state=active]:bg-[#7C3AED]/90 data-[state=active]:text-white text-gray-400 rounded-md"
              >
                Receive
              </TabsTrigger>
            </TabsList>

            <Card className="border-[#1F2037] bg-[#12132A]/95 backdrop-blur-sm shadow-xl">
              <TabsContent value="send" className="mt-0">
                <SendForm />
              </TabsContent>

              <TabsContent value="receive" className="mt-0">
                <ReceiveForm />
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  )
}