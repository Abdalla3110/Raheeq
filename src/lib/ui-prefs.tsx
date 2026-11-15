"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// ── ثيم + لغة ────────────────────────────────────────────────

export type Theme = "light" | "dark";
export type Lang = "ar" | "en";

interface UIPrefsContextValue {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  isReady: boolean;
}

const UIPrefsContext = createContext<UIPrefsContextValue | null>(null);

const THEME_KEY = "misk-theme";
const LANG_KEY = "misk-lang";

export function UIPrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("ar");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") setTheme(t);
      const l = localStorage.getItem(LANG_KEY);
      if (l === "en" || l === "ar") setLang(l);
    } catch {
      // تجاهل
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // تجاهل
    }
  }, [theme, isReady]);

  useEffect(() => {
    if (!isReady) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // تجاهل
    }
  }, [lang, isReady]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );
  const toggleLang = useCallback(
    () => setLang((l) => (l === "ar" ? "en" : "ar")),
    []
  );

  return (
    <UIPrefsContext.Provider
      value={{ theme, toggleTheme, lang, toggleLang, isReady }}
    >
      {children}
    </UIPrefsContext.Provider>
  );
}

export function useUIPrefs() {
  const ctx = useContext(UIPrefsContext);
  if (!ctx) throw new Error("useUIPrefs must be used within UIPrefsProvider");
  return ctx;
}
