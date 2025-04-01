"use client";

import SecurityResources from "@/components/education-center/security-resources";
import { useState } from "react";
import { motion } from "framer-motion";
import { Book, BookOpen, CircleHelp, NotepadText, Shield, Trash } from "lucide-react";

export default function Page() {
  const [activeTab, setActiveTab] = useState("blockchain guides");

  const tabs = [
    { icon: <Book size={20} />, label: "blockchain guides" },
    { icon: <NotepadText size={20} />, label: "wallet tutorials" },
    { icon: <BookOpen size={20} />, label: "crypto glossary" },
    { icon: <CircleHelp size={20} />, label: "Advanced FAQ" },
    { icon: <Shield size={20} />, label: "Security Resources" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "blockchain guides":
        return "blockchain guides content";
      case "wallet tutorials":
        return "wallet tutorials content";
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
    <div className="w-full min-h-screen flex flex-col items-start justify-start px-5 py-6 gap-5">
      <div className="w-full flex items-center justify-between gap-6">
        <h1 className="text-3xl font-bold text-[#fffff]  "   >Education Center</h1>
        <input type="search" placeholder="Search resources" className="border-[1px] border-[#ffffff/10] px-5 py-2  rounded-xs  " />
      </div>

      <div className="w-full h-full flex flex-col gap-5 items-start">
        <nav className="w-full flex items-center justify-evenly gap-6 bg-[#13182A] backdrop-blur-md border-[1px] border-[#374151] rounded-lg px-4 py-2 text-xs md:text-sm overflow-x-auto">
          {tabs.map((tab, index) => (
            <motion.button
              key={index}
              onClick={() => setActiveTab(tab.label)}
              whileHover={{ scale: 1.1, backgroundColor: "#45357a" }}
              whileTap={{ scale: 0.95 }}
              className={`cursor-pointer flex items-center gap-2 py-2 px-4 rounded-sm transition-all duration-300 whitespace-nowrap text-[#ffffff]  ${
                activeTab === tab.label ? "bg-[#371C5B]" : ""
              }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </nav>

        <div className="h-full w-full">{renderTabContent()}</div>
      </div>
    </div>
  );
}
