import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type PortfolioLanguage = "en" | "zh";

const STORAGE_KEY = "portfolio-language";

type PortfolioLanguageContextValue = {
  language: PortfolioLanguage;
  setLanguage: (language: PortfolioLanguage) => void;
};

const PortfolioLanguageContext =
  createContext<PortfolioLanguageContextValue | null>(null);

function readStoredLanguage(): PortfolioLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  return window.localStorage.getItem(STORAGE_KEY) === "zh" ? "zh" : "en";
}

function updatePortfolioMetadata(
  language: PortfolioLanguage,
  path: string
) {
  const isPortfolioRoute = path === "/" || path === "/resume";
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";

  if (!isPortfolioRoute) {
    return;
  }

  const isResume = path === "/resume";
  const title =
    language === "en"
      ? isResume
        ? "Ruiqiao Wang | Resume"
        : "Ruiqiao Wang | Full-Stack Portfolio"
      : isResume
        ? "王睿桥 | 简历"
        : "王睿桥 | 全栈开发作品集";
  const description =
    language === "en"
      ? "Ruiqiao Wang is a University of Auckland student building tested, accessible full-stack products with React, TypeScript and Cloudflare."
      : "王睿桥的全栈开发作品集：使用 React、TypeScript 与 Cloudflare 构建经过测试、注重无障碍的双语产品。";

  document.title = title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", description);
}

export function PortfolioLanguageProvider({
  children,
  path
}: {
  children: ReactNode;
  path: string;
}) {
  const [language, setLanguage] =
    useState<PortfolioLanguage>(readStoredLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    updatePortfolioMetadata(language, path);
  }, [language, path]);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language]
  );

  return (
    <PortfolioLanguageContext.Provider value={value}>
      {children}
    </PortfolioLanguageContext.Provider>
  );
}

export function usePortfolioLanguage() {
  const value = useContext(PortfolioLanguageContext);

  if (!value) {
    throw new Error(
      "usePortfolioLanguage must be used inside PortfolioLanguageProvider"
    );
  }

  return value;
}

export function LanguageToggle() {
  const { language, setLanguage } = usePortfolioLanguage();
  const nextLanguage = language === "en" ? "zh" : "en";

  return (
    <button
      className="language-toggle"
      type="button"
      aria-label={
        language === "en" ? "Switch to Chinese" : "切换到英文"
      }
      onClick={() => setLanguage(nextLanguage)}
    >
      <span className={language === "en" ? "is-active" : ""}>EN</span>
      <span aria-hidden="true">/</span>
      <span className={language === "zh" ? "is-active" : ""}>中文</span>
    </button>
  );
}
