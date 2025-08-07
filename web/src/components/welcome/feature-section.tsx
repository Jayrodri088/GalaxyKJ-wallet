"use client";

import { motion } from "framer-motion";
import { Shield, Zap, RefreshCw, Globe } from "lucide-react";
import { useClientTranslation } from "@/contexts/language-provider";

export function FeatureSection() {
  const { t } = useClientTranslation();

  const benefits = [
    {
      icon: <Shield className="h-8 w-8 text-blue-400" />,
      title: t("home.features.security.title"),
      description: t("home.features.security.description"),
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      title: t("home.features.ai.title"),
      description: t("home.features.ai.description"),
    },
    {
      icon: <RefreshCw className="h-8 w-8 text-purple-400" />,
      title: t("home.features.exchanges.title"),
      description: t("home.features.exchanges.description"),
    },
    {
      icon: <Globe className="h-8 w-8 text-green-400" />,
      title: t("home.features.global.title"),
      description: t("home.features.global.description"),
    },
  ];

  return (
    <section className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Stellar Ecosystem Integration
          </h2>
          <p className="text-xl text-blue-100/70 max-w-3xl mx-auto">
            Experience seamless connectivity with the entire Stellar network,
            enabling fast and secure transactions across the galaxy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="bg-gradient-to-b from-[#1E1E3F]/80 to-[#12132A]/80 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-blue-100/70">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
