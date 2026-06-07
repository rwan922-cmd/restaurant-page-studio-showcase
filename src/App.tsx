import type { ReactNode } from "react";
import { restaurants } from "./data/restaurants";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PreviewPage } from "./pages/PreviewPage";
import { ReservePage } from "./pages/ReservePage";
import { CounterLoginPage } from "./pages/CounterLoginPage";
import { CounterReservationsPage } from "./pages/CounterReservationsPage";
import { ReservationStatusPage } from "./pages/ReservationStatusPage";
import { ResumePage } from "./pages/ResumePage";
import { StudioPage } from "./pages/StudioPage";
import {
  PortfolioLanguageProvider,
  usePortfolioLanguage
} from "./i18n/portfolioLanguage";

type AppProps = {
  path?: string;
  studioEnabled?: boolean;
};

export function App({
  path = window.location.pathname,
  studioEnabled = import.meta.env.DEV
}: AppProps) {
  let page;

  if (path === "/") {
    page = <HomePage />;
  } else if (path === "/resume") {
    page = <ResumePage />;
  } else if (path === "/counter/login") {
    page = <CounterLoginPage />;
  } else if (path === "/counter/reservations") {
    page = <CounterReservationsPage />;
  } else if (path.startsWith("/reservation/")) {
    const statusToken = path.slice("/reservation/".length).replace(/\/+$/, "");
    page = statusToken ? (
      <ReservationStatusPage statusToken={statusToken} />
    ) : (
      <NotFoundPage />
    );
  } else if (path === "/studio") {
    page = studioEnabled ? <StudioPage /> : <NotFoundPage />;
  } else if (path.startsWith("/p/")) {
    const parts = path.slice(3).replace(/\/+$/, "").split("/");
    const slug = parts[0];
    const profile = restaurants[slug];
    if (profile && parts[1] === "menu" && parts.length === 2) {
      page = <MenuPage profile={profile} />;
    } else if (
      profile?.reservationEnabled &&
      parts[1] === "reserve" &&
      parts.length === 2
    ) {
      page = <ReservePage profile={profile} />;
    } else if (profile && parts.length === 1) {
      page = <PreviewPage profile={profile} />;
    } else {
      page = <NotFoundPage preview />;
    }
  } else {
    page = <NotFoundPage />;
  }

  return (
    <PortfolioLanguageProvider path={path}>
      <AppShell path={path}>{page}</AppShell>
    </PortfolioLanguageProvider>
  );
}

function AppShell({
  children
}: {
  children: ReactNode;
  path: string;
}) {
  const { language } = usePortfolioLanguage();

  return (
    <>
      <a className="skip-link" href="#main-content">
        {language === "en" ? "Skip to main content" : "跳到主要内容"}
      </a>
      {children}
    </>
  );
}
