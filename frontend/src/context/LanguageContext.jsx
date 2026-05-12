import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);
const SUPPORTED_LANGUAGES = ["fr", "ar"];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem("clinic_language");
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : "fr";
  });

  useEffect(() => {
    localStorage.setItem("clinic_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (nextLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(nextLanguage)) {
      setLanguageState(nextLanguage);
    }
  };

  const t = (key, params = {}) => {
    const parts = key.split(".");
    let current = translations[language];

    for (const part of parts) {
      current = current?.[part];
      if (current === undefined) {
        return key;
      }
    }

    if (typeof current !== "string") {
      return key;
    }

    return current.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      dir: language === "ar" ? "rtl" : "ltr",
      t
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return ctx;
}
