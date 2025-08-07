"use client";

import { motion } from "framer-motion";
import { OutWalletButton } from "@/components/welcome/auth-wallet-button";
import { useClientTranslation } from "@/contexts/language-provider";

interface CTASectionProps {
  onGetStarted: () => void;
  isLoading: boolean;
}

export function CTASection({ onGetStarted, isLoading }: CTASectionProps) {
  const { t } = useClientTranslation();

  return (
    <section className="relative py-20 md:py-28 bg-transparent">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {t("home.cta.title")}
          </h2>
          <p className="text-xl text-blue-100/70 mb-10 max-w-2xl mx-auto">
            {t("home.cta.description")}
          </p>

          <div className="flex justify-center">
            <OutWalletButton
              onClick={onGetStarted}
              label={t("home.cta.button")}
              loadingLabel={t("home.cta.loadingButton")}
              isLoading={isLoading}
              size="large"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
