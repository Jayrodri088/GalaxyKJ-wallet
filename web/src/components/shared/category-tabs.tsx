"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Tab {
  icon: ReactNode;
  label: string;
}

interface CategoryTabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function CategoryTabs({
  tabs,
  activeTab,
  setActiveTab,
}: CategoryTabsProps) {
  return (
    <nav className="w-full flex items-center justify-start gap-2 sm:gap-6 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-lg px-3 py-2 text-xs md:text-sm overflow-x-auto">
      {tabs.map((tab, index) => (
        <motion.button
          key={index}
          onClick={() => setActiveTab(tab.label)}
          whileHover={{
            scale: 1.05,
            backgroundColor: "rgba(124, 58, 237, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          className={`cursor-pointer flex items-center gap-2 py-2 px-3 rounded-md transition-all duration-300 whitespace-nowrap text-white w-full justify-center ${
            activeTab === tab.label
              ? "bg-purple-900/50 border border-purple-700/50"
              : "hover:bg-gray-800/50"
          }`}
        >
          <span
            className={
              activeTab === tab.label ? "text-purple-400" : "text-gray-400"
            }
          >
            {tab.icon}
          </span>
          <span className="capitalize">{tab.label}</span>
        </motion.button>
      ))}
    </nav>
  );
}
