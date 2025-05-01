"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiRecommendations } from "@/components/dashboard/ai-recommendations"
import { SecurityOptions } from "@/components/dashboard/security-options"

export function RightPanelTabs() {
  return (
    <Tabs defaultValue="ai" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
        <TabsTrigger
          value="ai"
          className="data-[state=active]:bg-purple-900/50"
        >
          AI Insights
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="data-[state=active]:bg-purple-900/50"
        >
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="mt-4">
        <AiRecommendations />
      </TabsContent>
      <TabsContent value="security" className="mt-4">
        <SecurityOptions />
      </TabsContent>
    </Tabs>
  )
}
