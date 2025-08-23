"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loadTranslations = async () => {
      try {
        // Only reload resources if they exist
        if (i18n.reloadResources) {
          await i18n.reloadResources();
        }
        
        // Only load namespaces if they exist
        if (i18n.loadNamespaces) {
          await i18n.loadNamespaces("common");
        }
      } catch (error) {
        console.warn("Failed to load translations:", error);
        // Continue without translations rather than crashing
      }
    };

    loadTranslations();
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export const useClientTranslation = () => {
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    setIsClient(true);
  }, []);

  return {
    t: isClient ? t : (key: string) => key,
    isClient,
  };
};
