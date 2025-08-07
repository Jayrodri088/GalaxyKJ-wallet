import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export const useLanguage = () => {
  const { i18n } = useTranslation("common");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const changeLanguage = async (language: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("i18nextLng");
      await i18n.reloadResources();
      await i18n.changeLanguage(language);
    }
  };

  return {
    currentLanguage: isClient ? i18n.language : "en",
    changeLanguage,
    isClient,
  };
};
