"use client";

import { useState } from "react";
import {
  FileText,
  BookOpen,
  BookText,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import WalletTutorials from "@/components/education-center/wallet-tutorials";
import SecurityResources from "@/components/education-center/security-resources";

export default function Page() {
  const [activeTab, setActiveTab] = useState("wallet tutorials");

  const tabs = [
    { icon: <FileText size={20} />, label: "blockchain guides" },
    { icon: <BookOpen size={20} />, label: "wallet tutorials" },
    { icon: <BookText size={20} />, label: "crypto glossary" },
    { icon: <HelpCircle size={20} />, label: "Advanced FAQ" },
    { icon: <ShieldCheck size={20} />, label: "Security Resources" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "blockchain guides":
        return "blockchain guides content";
      case "wallet tutorials":
        return <WalletTutorials />;
      case "crypto glossary":
        return "crypto glossary content";
      case "Advanced FAQ":
        return "Advanced FAQ content";
      case "Security Resources":
        return <SecurityResources />;
      default:
        return "Select a tab";
    }
  };

  return (
    <div className="w-full min-h-screen bg-[url('/stars-bg.png')] text-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Galaxy Wallet Knowledge Hub</h1>
        <p className="text-gray-400 mb-8">
          Explore our comprehensive resources to master cryptocurrency and
          blockchain concepts
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center justify-center py-3 px-4 rounded text-sm font-medium transition-colors ${
                activeTab === tab.label
                  ? "bg-purple-900/70 text-white"
                  : "bg-[#111827]/70 text-gray-300 hover:bg-[#1a2234]/70"
              }`}
            >
              {tab.icon}
              <span className="ml-2">
                {tab.label.charAt(0).toUpperCase() + tab.label.slice(1)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8">{renderTabContent()}</div>
      </div>
    </div>
  );
}
