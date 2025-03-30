"use client";

import SecurityResources from "@/components/security-resources";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Page() {
  const [activeTab, setActiveTab] = useState("blockchain guides");

  const renderTabContent = () => {
    switch (activeTab) {
      case "blockchain guides":
        return "blockchain guides content";
      case "wallet tutorials":
        return "wallet tutorials content";
      case "crypto glossary":
        return "crypto glossary content";
      case "Advanced FAQ":
        return "Advanced FAQ";
      case "Security Resources":
        return <SecurityResources />;
      default:
        return "Select a tab";
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-start justify-start px-5 py-6 gap-5">
      <div className="w-full flex items-center justify-between gap-6">
        <h1>Education Center</h1>
        <input type="search" placeholder="Search resources" />
      </div>

      <div className="w-full h-full flex flex-col gap-5 items-start">
        <nav className="w-full flex items-center justify-evenly gap-6 bg-[#13182A] backdrop-blur-md border-[1px] border-[#374151] rounded-lg px-4 py-2 overflow-x-auto">
          {["blockchain guides", "wallet tutorials", "crypto glossary", "Advanced FAQ", "Security Resources"].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: 1.1, backgroundColor: "#45357a" }}
              whileTap={{ scale: 0.95 }}
              className={`cursor-pointer py-2 px-4 rounded-sm transition-all duration-300 ${
                activeTab === tab ? "bg-[#371C5B]" : ""
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </nav>

        <div className="h-full w-full">{renderTabContent()}</div>
      </div>
    </div>
  );
}