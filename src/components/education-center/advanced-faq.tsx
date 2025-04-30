"use client";

import { motion } from "framer-motion";

export function AdvancedFAQ() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-xl p-10 flex items-center justify-center"
    >
      <div className="text-center">
        <h3 className="text-xl font-medium text-gray-300 mb-2">Advanced FAQ</h3>
        <p className="text-gray-400">
          Coming soon. Check back for detailed answers to complex questions.
        </p>
      </div>
    </motion.div>
  );
}
