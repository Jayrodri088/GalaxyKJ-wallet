"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Fingerprint, AlertTriangle, Lock, Key, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function SecurityOptions() {
  const { toast } = useToast();
  const router = useRouter();

  const securityFeatures = [
    {
      id: "multisig",
      name: "Multi-signature",
      description: "Require multiple signatures for transactions over 100 XLM",
      icon: <Key className="h-5 w-5 text-blue-400" />,
      enabled: true,
    },
    {
      id: "biometric",
      name: "Biometric Authentication",
      description: "Use fingerprint or facial recognition to authorize transactions",
      icon: <Fingerprint className="h-5 w-5 text-green-400" />,
      enabled: true,
    },
    {
      id: "suspicious",
      name: "Suspicious Activity Detection",
      description: "Receive alerts for unusual account activity",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
      enabled: false,
    },
    {
      id: "timelock",
      name: "Time-Locked Transactions",
      description: "Add a delay to large transactions for increased security",
      icon: <Lock className="h-5 w-5 text-purple-400" />,
      enabled: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-gray-300">Security Settings</h3>
        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
          <Shield className="h-3 w-3 mr-1" />
          Protected
        </Badge>
      </div>

      <div className="space-y-3">
        {securityFeatures.map((feature) => (
          <Card key={feature.id} className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.name}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
                <Switch checked={feature.enabled} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
        onClick={() => toast({ title: "Advanced security settings coming soon" })}
      >
        Advanced Security Settings
      </Button>

      <Button
        variant="outline"
        className="w-full mt-2 border-purple-700/30 bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 flex items-center justify-center gap-2"
        onClick={() => router.push("/support")}
      >
        <HelpCircle className="h-4 w-4" />
        Support Center
      </Button>
    </div>
  );
}
