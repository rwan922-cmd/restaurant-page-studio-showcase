import { buildMailto } from "../config/contact";
import type { RestaurantProfile } from "../domain/restaurant";
import { usePortfolioLanguage } from "../i18n/portfolioLanguage";

type MobileActionDockProps = {
  profile: RestaurantProfile;
  current: "home" | "menu" | "reserve";
};

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function contactHref(profile: RestaurantProfile) {
  if (profile.phone) {
    return phoneHref(profile.phone);
  }
  if (profile.socialUrl) {
    return profile.socialUrl;
  }
  return buildMailto(
    `${profile.nameZh} - 联系咨询`,
    `你好，我想联系${profile.nameZh} ${profile.nameEn}，请协助回复。`
  );
}

function reservationHref(profile: RestaurantProfile) {
  if (profile.reservationEnabled) {
    return `/p/${profile.slug}/reserve`;
  }
  if (profile.bookingUrl) {
    return profile.bookingUrl;
  }
  if (profile.phone) {
    return phoneHref(profile.phone);
  }
  return buildMailto(
    `${profile.nameZh} - 订位咨询`,
    `你好，我想预定${profile.nameZh} ${profile.nameEn}的座位。`
  );
}

export function MobileActionDock({
  profile,
  current
}: MobileActionDockProps) {
  const { language } = usePortfolioLanguage();
  const isEnglish = language === "en";
  const contact = contactHref(profile);
  const reservation = reservationHref(profile);
  const externalReservation =
    !profile.reservationEnabled && Boolean(profile.bookingUrl);

  return (
    <nav
      className="mobile-action-dock"
      aria-label={isEnglish ? "Mobile quick actions" : "手机快捷导航"}
    >
      <a
        href={`/p/${profile.slug}`}
        aria-current={current === "home" ? "page" : undefined}
        aria-label={isEnglish ? "Back to restaurant home" : "返回餐厅主页"}
      >
        <span>{isEnglish ? "Home" : "主页"}</span>
        <small>{isEnglish ? "Overview" : "Home"}</small>
      </a>
      <a
        href={`/p/${profile.slug}/menu`}
        aria-current={current === "menu" ? "page" : undefined}
      >
        <span>{isEnglish ? "Menu" : "菜单"}</span>
        <small>{isEnglish ? "Dishes" : "Menu"}</small>
      </a>
      <a
        className="mobile-action-dock__primary"
        href={reservation}
        aria-current={current === "reserve" ? "page" : undefined}
        target={externalReservation ? "_blank" : undefined}
        rel={externalReservation ? "noreferrer" : undefined}
        aria-label={isEnglish ? "Book a table" : "预定座位"}
      >
        <span>{isEnglish ? "Book" : "订位"}</span>
        <small>{isEnglish ? "Reserve" : "Book"}</small>
      </a>
      <a
        href={contact}
        target={!profile.phone && profile.socialUrl ? "_blank" : undefined}
        rel={!profile.phone && profile.socialUrl ? "noreferrer" : undefined}
      >
        <span>{isEnglish ? "Contact" : "联系"}</span>
        <small>{isEnglish ? "Call" : "Contact"}</small>
      </a>
    </nav>
  );
}
