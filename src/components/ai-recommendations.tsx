"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RecommendationType = "opportunity" | "alert" | "insight";
type ConfidenceLevel = "high" | "medium" | "low";

type Recommendation = {
  type: RecommendationType;
  title: string;
  description: string;
  action: string;
  confidence: ConfidenceLevel;
};

const recommendations: Recommendation[] = [
  {
    type: "opportunity",
    title: "Expected increase in XLM",
    description: "Based on recent market trends, XLM could see a 5-8% rise in the next 48 hours.",
    action: "Consider buying",
    confidence: "high",
  },
  {
    type: "alert",
    title: "Unusual volatility",
    description: "Crypto markets are experiencing higher-than-normal volatility. Consider reducing exposure.",
    action: "Review portfolio",
    confidence: "medium",
  },
  {
    type: "insight",
    title: "Portfolio diversification",
    description: "Your portfolio is heavily concentrated in XLM (35%). Consider diversifying to reduce risk.",
    action: "Rebalance",
    confidence: "high",
  },
];

const getRecommendationIcon = (type: RecommendationType) => {
  switch (type) {
    case "opportunity":
      return <TrendingUp className="h-5 w-5 text-green-400" />;
    case "alert":
      return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    case "insight":
      return <Lightbulb className="h-5 w-5 text-blue-400" />;
    default:
      return null;
  }
};

const getConfidenceBadge = (confidence: ConfidenceLevel) => {
  switch (confidence) {
    case "high":
      return (
        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
          High confidence
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-800">
          Medium confidence
        </Badge>
      );
    case "low":
      return (
        <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-800">
          Low confidence
        </Badge>
      );
    default:
      return null;
  }
};

export function AiRecommendations() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-gray-300">AI Financial Insights</h3>
        <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-800">
          Updated 5m ago
        </Badge>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <Card key={index} className="border-gray-800 bg-gray-900/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  {getRecommendationIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{rec.title}</h4>
                    {getConfidenceBadge(rec.confidence)}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{rec.description}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 px-3 py-1 h-8"
                    onClick={() => toast({ title: `Action: ${rec.action}` })}
                  >
                    {rec.action}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
        onClick={() => toast({ title: "View all insights coming soon" })}
      >
        View All Insights
      </Button>
    </div>
  );
}
