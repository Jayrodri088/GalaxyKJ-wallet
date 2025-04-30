"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Save } from "lucide-react";
import { AlertTriangle, Proportions } from "lucide-react";
import { Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomSelect } from "@/components/ui/custom-select";

interface Widget {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
}

const defaultWidgets: Widget[] = [
  {
    id: "portfolio",
    name: "Portfolio Overview",
    description:
      "Shows your portfolio value, distribution, and performance metrics.",
    status: "active",
  },
  {
    id: "quick-actions",
    name: "Quick Actions",
    description:
      "Provides quick access to common actions like send, receive, and swap.",
    status: "active",
  },
  {
    id: "market",
    name: "Market Overview",
    description:
      "Shows current market trends and prices for your favorite assets.",
    status: "active",
  },
  {
    id: "transactions",
    name: "Recent Transactions",
    description: "Lists your most recent transaction activity.",
    status: "active",
  },
  {
    id: "alerts",
    name: "Price Alerts",
    description: "Shows your active price alerts and notifications.",
    status: "active",
  },
];

export const WidgetTab = () => {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [layoutConfig, setLayoutConfig] = useState({
    type: "grid",
    columns: 3,
    spacing: "medium",
    animation: "fade",
    refreshInterval: 30,
    autoArrange: true,
  });

  const handleConfigure = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsConfigOpen(true);
  };

  const handleRemove = (widgetId: string) => {
    setWidgets(
      widgets.map((w) => (w.id === widgetId ? { ...w, status: "inactive" } : w))
    );
  };

  const handleAddWidget = () => {
    // TODO: Implement marketplace or selection modal
    console.log("Add widget clicked");
  };

  const layoutTypeOptions = [
    { value: "grid", label: "Grid Layout" },
    { value: "list", label: "List Layout" },
    { value: "custom", label: "Custom Layout" },
  ];

  const columnOptions = [
    { value: "1", label: "1 Column" },
    { value: "2", label: "2 Columns" },
    { value: "3", label: "3 Columns" },
    { value: "4", label: "4 Columns" },
  ];

  const spacingOptions = [
    { value: "compact", label: "Compact" },
    { value: "medium", label: "Medium" },
    { value: "spacious", label: "Spacious" },
  ];

  const animationOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide", label: "Slide" },
    { value: "scale", label: "Scale" },
    { value: "none", label: "None" },
  ];

  return (
    <div className="min-h-screen bg-gray-900/50 text-gray-200 p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-[#5298e8] to-[#7C3AED] bg-clip-text text-transparent">
            Widget Configuration
          </h1>
          <p className="text-gray-400 text-sm">
            Customize your dashboard with widgets and personalized views
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="text-gray-200 bg-gray-900 hover:bg-black"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button className="bg-gradient-to-r from-[#7C3AED] to-[#3a72ea] hover:opacity-90">
            <span>
              <Save className="w-4 h-4 mr-2" />
            </span>
            Save Layout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="widgets" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent">
          <TabsTrigger
            value="widgets"
            className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-white text-gray-400"
          >
            <Proportions className="w-4 h-4 mr-2" />
            Widgets
          </TabsTrigger>
          <TabsTrigger
            value="custom-views"
            className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-white text-gray-400"
          >
            <Eye className="w-4 h-4 mr-2" />
            Custom Views
          </TabsTrigger>
          <TabsTrigger
            value="price-alerts"
            className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-white text-gray-400"
          >
            <Bell className="w-4 h-4 mr-2" />
            Price Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widgets">
          {/* Available Widgets Section */}
          <div className="flex justify-between mb-4 mt-4 items-center">
            <h2 className="text-xl font-semibold">Available Widgets</h2>
            <Button
              onClick={handleAddWidget}
              className="bg-gradient-to-r from-[#7C3AED] to-[#3a72ea]  hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <Card
                key={widget.id}
                className=" bg-gray-900/40 border border-gray-800 rounded-xl shadow-lg transition-all hover:bg-gray-800/40 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <span className="text-gray-400">□</span>
                      <h3 className="text-lg font-medium">{widget.name}</h3>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                        {widget.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 ">{widget.description}</p>
                  <div className="flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleConfigure(widget)}
                      className="bg-black/50 font-semibold hover:bg-black"
                    >
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(widget.id)}
                      className="text-red-400 flex items-center gap-1 "
                    >
                      <X className="w-4 h-4" />
                      <span>Remove</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add Widget Card */}
            <Card className="bg-gray-900/10 border-2 border-dashed border-gray-700 rounded-xl shadow-lg transition-all hover:border-purple-500/50 hover:bg-gray-900/20 p-6 flex flex-col items-center justify-center text-center min-h-[200px] cursor-pointer group">
              <div className="w-12 h-12 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Plus className="w-10 h-10 text-gray-500 group-hover:text-purple-400" />
              </div>
              <p className="text-gray-400 mb-4 group-hover:text-gray-300">
                Add more widgets from the marketplace
              </p>
              <Button
                variant="ghost"
                className="text-gray-200 bg-black/50 hover:bg-black group-hover:bg-purple-900/20"
                onClick={handleAddWidget}
              >
                Browse Marketplace
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom-views">
          {/* Custom Views Content */}
        </TabsContent>

        <TabsContent value="price-alerts">
          {/* Price Alerts Content */}
        </TabsContent>
      </Tabs>

      {/* Layout Configuration Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Layout Configuration</h2>
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Layout Type"
              value={layoutConfig.type}
              options={layoutTypeOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, type: value })
              }
            />

            <CustomSelect
              label="Column Count (Desktop)"
              value={layoutConfig.columns.toString()}
              options={columnOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, columns: parseInt(value) })
              }
            />

            <CustomSelect
              label="Widget Spacing"
              value={layoutConfig.spacing}
              options={spacingOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, spacing: value })
              }
            />

            <CustomSelect
              label="Animation Style"
              value={layoutConfig.animation}
              options={animationOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, animation: value })
              }
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Auto-refresh Interval: {layoutConfig.refreshInterval}s
            </label>
            <Slider
              value={[layoutConfig.refreshInterval]}
              onValueChange={(value) =>
                setLayoutConfig({ ...layoutConfig, refreshInterval: value[0] })
              }
              min={5}
              max={300}
              step={5}
              className="py-4"
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <Switch
              checked={layoutConfig.autoArrange}
              onCheckedChange={(checked) =>
                setLayoutConfig({ ...layoutConfig, autoArrange: checked })
              }
              className="data-[state=checked]:bg-[#7C3AED]  data-[state=unchecked]:bg-gray-700"
            />
            <label className="text-sm text-gray-400">
              Auto-arrange widgets based on usage frequency
            </label>
          </div>
        </div>
      </section>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Configure {selectedWidget?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedWidget && (
            <div className="space-y-4">
              <p className="text-gray-400">{selectedWidget.description}</p>
              {/* Add widget-specific configuration options here */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
