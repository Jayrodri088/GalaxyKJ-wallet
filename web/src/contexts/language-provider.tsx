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
      await i18n.reloadResources();
      await i18n.loadNamespaces("common");
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
