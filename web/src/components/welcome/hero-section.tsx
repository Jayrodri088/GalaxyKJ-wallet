"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useClientTranslation } from "@/contexts/language-provider";

interface HeroSectionProps {
  scrollYProgress: MotionValue<number>;
}

export function HeroSection({ scrollYProgress }: HeroSectionProps) {
  const { t } = useClientTranslation();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start pt-16 md:pt-28 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-indigo-900/5 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 z-10 relative">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Logo */}
          <motion.div
            className="relative mx-auto w-72 h-72"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            style={{ y: y1 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-2xl animate-pulse-slow"></div>
            <Image
              src="/images/galaxy-text-logo.png"
              alt="Galaxy Smart Wallet"
              width={320}
              height={320}
              className="w-full h-full object-contain animate-float"
            />
          </motion.div>

          {/* Title */}
          <h1 className="text-[5rem] md:text-[8rem] font-bold tracking-tighter leading-none mt-6">
            <span className="relative inline-block">
              <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                GALAXY
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-xl opacity-30 animate-pulse"></span>
            </span>
            <br />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                WALLET
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-30 animate-pulse"></span>
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            className="text-2xl md:text-3xl text-blue-100/80 max-w-3xl mx-auto mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {t("home.hero.title")}
          </motion.p>

          {/* Scroll Indicator */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm text-blue-200/70 mb-2">
                {t("home.hero.scrollIndicator")}
              </span>
              <div className="w-6 h-10 border-2 border-blue-200/50 rounded-full flex justify-center p-1">
                <motion.div
                  className="w-1.5 h-1.5 bg-blue-200 rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
