"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useClientTranslation } from "@/contexts/language-provider";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", nameKey: "language.english" },
  { code: "es", nameKey: "language.spanish" },
];

export const LanguageToggle = () => {
  const { currentLanguage, changeLanguage, isClient } = useLanguage();
  const { t } = useClientTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setIsOpen(false);
  };

  if (!isClient) {
    return (
      <Button variant="outline" size="icon" className="relative">
        <Globe className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Globe className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-gray-900/90 backdrop-blur-md p-1 text-white shadow-md">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-800 focus:bg-gray-800",
                currentLanguage === language.code &&
                  "bg-blue-600/20 text-blue-300"
              )}
            >
              {t(language.nameKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
