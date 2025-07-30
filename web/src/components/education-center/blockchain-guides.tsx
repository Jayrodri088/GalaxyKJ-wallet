"use client";

import { ResourceCard } from "@/components/education-center/resource-card";
import { blockchainguidesData } from "@/data/blockchain-guides-data";
import { motion } from "framer-motion";

export function BlockchainGuides() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {blockchainguidesData.map((guide, index) => (
        <motion.div key={index} variants={item}>
          <ResourceCard
            imageSrc={guide.imageSrc}
            title={guide.title}
            description={guide.description}
            duration={guide.duration}
            level={guide.level}
            category={guide.category}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
