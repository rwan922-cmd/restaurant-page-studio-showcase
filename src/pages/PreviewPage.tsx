import { useEffect } from "react";
import { ContactPanel } from "../components/ContactPanel";
import { FoodImage } from "../components/FoodImage";
import { MobileActionDock } from "../components/MobileActionDock";
import type { RestaurantProfile } from "../domain/restaurant";
import {
  LanguageToggle,
  usePortfolioLanguage
} from "../i18n/portfolioLanguage";

type PreviewPageProps = {
  profile: RestaurantProfile;
};

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function priceText(price: number | undefined, isEnglish: boolean) {
  return price
    ? `NZ$${price.toFixed(2)}`
    : isEnglish
      ? "Confirm price"
      : "价格请向商家确认";
}

export function PreviewPage({ profile }: PreviewPageProps) {
  const { language } = usePortfolioLanguage();
  const isEnglish = language === "en";

  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>(
      'meta[name="robots"]'
    );
    const meta = existing ?? document.createElement("meta");
    const previousContent = existing?.content;

    meta.name = "robots";
    meta.content = "noindex, nofollow";
    if (!existing) {
      document.head.append(meta);
    }

    return () => {
      if (existing && previousContent !== undefined) {
        existing.content = previousContent;
      } else {
        meta.remove();
      }
    };
  }, [profile.slug]);

  const locations =
    profile.locations ??
    (profile.address
      ? [
          {
            address: profile.address,
            phone: profile.phone,
            mapsUrl: profile.mapsUrl
          }
        ]
      : []);

  return (
    <main
      id="main-content"
      className={`restaurant-page theme-${profile.theme}`}
    >
      <section className="restaurant-hero">
        <div className="restaurant-hero__media" aria-hidden="true">
          {profile.heroImages.map((image, index) => (
            <FoodImage
              asset={image}
              className={`restaurant-hero__image restaurant-hero__image--${index + 1}`}
              priority={index === 0}
              testId="hero-image"
              key={image.desktopSrc}
            />
          ))}
        </div>
        <div className="restaurant-hero__overlay" />
        <div className="restaurant-hero__content">
          <LanguageToggle />
          <p className="status-pill">
            {isEnglish ? profile.openingStatusEn : profile.openingStatusZh}
          </p>
          <p className="restaurant-hero__city">{profile.city}</p>
          <h1>
            {isEnglish ? profile.nameEn : profile.nameZh}
            <span>{isEnglish ? profile.nameZh : profile.nameEn}</span>
          </h1>
          <p>
            {isEnglish ? profile.taglineEn : profile.taglineZh}
          </p>
          {profile.address && <address>{profile.address}</address>}
        </div>
      </section>

      <nav
        className="restaurant-actions"
        aria-label={isEnglish ? "Restaurant quick actions" : "餐馆快捷操作"}
      >
        <a href={`/p/${profile.slug}/menu`}>
          {isEnglish ? "Full menu" : "完整菜单"}
        </a>
        {profile.reservationEnabled ? (
          <a href={`/p/${profile.slug}/reserve`}>
            {isEnglish ? "Book a table" : "在线订位"}
          </a>
        ) : profile.bookingUrl ? (
          <a href={profile.bookingUrl} target="_blank" rel="noreferrer">
            {isEnglish ? "Book a table" : "在线订位"}
          </a>
        ) : null}
        {profile.phone && (
          <a href={phoneHref(profile.phone)}>
            {isEnglish ? "Call" : "电话订餐"}
          </a>
        )}
        {profile.mapsUrl && (
          <a href={profile.mapsUrl} target="_blank" rel="noreferrer">
            {isEnglish ? "Directions" : "导航"}
          </a>
        )}
        {profile.socialUrl && (
          <a href={profile.socialUrl} target="_blank" rel="noreferrer">
            {isEnglish ? "Social" : "社交媒体"}
          </a>
        )}
      </nav>

      {(profile.aboutZh || profile.aboutEn) && (
        <section className="story-section">
          <div>
            <p className="section-label">
              {isEnglish ? "About the restaurant" : "关于餐厅"}
            </p>
            <h2>{isEnglish ? "Brand story" : "品牌介绍"}</h2>
          </div>
          <div className="story-section__copy">
            <p>{isEnglish ? profile.aboutEn : profile.aboutZh}</p>
          </div>
        </section>
      )}

      <section className="gallery-section">
        <div className="gallery-section__heading">
          <p className="section-label">
            {isEnglish ? "Selected moments" : "精选画面"}
          </p>
          <h2>{isEnglish ? "Featured images" : "精选照片"}</h2>
          <p>
            {profile.galleryImages.some((image) => image.sourceType === "concept")
              ? isEnglish
                ? "Concept image, not a merchant photograph. Real projects must replace this with merchant-approved photography."
                : "概念画面，非商家实拍。用于真实项目时必须替换为商家授权照片。"
              : isEnglish
                ? "Photography supplied with merchant approval."
                : "照片由商家授权提供。"}
          </p>
        </div>
        <div className="photo-grid">
          {profile.galleryImages.map((image, index) => (
            <figure
              className={`photo-grid__item photo-grid__item--${index + 1}`}
              key={image.desktopSrc}
            >
              <FoodImage asset={image} testId="gallery-image" />
              <figcaption>
                {isEnglish ? image.altEn : image.altZh}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="menu-section">
        <div className="section-heading">
          <p className="section-label">
            {isEnglish ? "Menu highlights" : "菜单预览"}
          </p>
          <h2>{isEnglish ? "Menu highlights" : "菜单精选"}</h2>
          <p>
            {isEnglish
              ? "Demo content is a concept selection. Final dishes and prices would need merchant confirmation."
              : "页面内容为概念精选，最终菜品与标价以商家确认为准。"}
          </p>
        </div>
        <div className="menu-groups">
          {profile.menuSections.map((section) => (
            <section
              className="menu-group"
              key={`${section.titleZh}-${section.titleEn ?? ""}`}
            >
              <h3>
                {isEnglish ? section.titleEn ?? section.titleZh : section.titleZh}
                <span>{isEnglish ? section.titleZh : section.titleEn}</span>
              </h3>
              <div className="dish-list">
                {section.dishes.map((dish) => (
                  <article
                    key={`${section.titleZh}-${dish.nameZh}`}
                    className="dish-row"
                  >
                    <FoodImage asset={dish.image} />
                    <div>
                      <h4>{isEnglish ? dish.nameEn : dish.nameZh}</h4>
                      <p>{isEnglish ? dish.nameZh : dish.nameEn}</p>
                      <p className="dish-row__description">
                        {isEnglish ? dish.descriptionEn : dish.descriptionZh}
                      </p>
                    </div>
                    <strong>{priceText(dish.price, isEnglish)}</strong>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        <a className="menu-section__cta" href={`/p/${profile.slug}/menu`}>
          {isEnglish ? "Explore full menu" : "浏览完整菜单"}
        </a>
      </section>

      {(profile.hours || locations.length > 0) && (
        <section className="details-grid">
          {profile.hours && (
            <div className="details-card">
              <p className="section-label">
                {isEnglish ? "Opening hours" : "营业安排"}
              </p>
              <h2>{isEnglish ? "Opening hours" : "营业时间"}</h2>
              <dl className="hours-list">
                {profile.hours.map((entry) => (
                  <div key={`${entry.labelZh}-${entry.valueZh}`}>
                    <dt>
                      {isEnglish ? entry.labelEn ?? entry.labelZh : entry.labelZh}
                    </dt>
                    <dd>
                      {isEnglish ? entry.valueEn ?? entry.valueZh : entry.valueZh}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {locations.length > 0 && (
            <div className="details-card">
              <p className="section-label">
                {isEnglish ? "Location" : "到店信息"}
              </p>
              <h2>{isEnglish ? "Location" : "门店位置"}</h2>
              <div className="location-list">
                {locations.map((location) => (
                  <article key={location.address}>
                    {(location.nameZh || location.nameEn) && (
                      <h3>
                        {isEnglish
                          ? location.nameEn ?? location.nameZh
                          : location.nameZh}
                        <span>
                          {isEnglish ? location.nameZh : location.nameEn}
                        </span>
                      </h3>
                    )}
                    <address>{location.address}</address>
                    <div className="location-links">
                      {location.phone && (
                        <a href={phoneHref(location.phone)}>
                          {isEnglish ? "Call" : "电话"}
                        </a>
                      )}
                      {location.mapsUrl && (
                        <a
                          href={location.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {isEnglish ? "Map" : "地图"}
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <aside className="concept-notice">
        <strong>
          {isEnglish ? "Unofficial concept demo" : "非官方概念预览"}
        </strong>
        <span>
          {isEnglish
            ? "This page demonstrates the design and workflow only. It is not an official restaurant website."
            : "此页面用于展示设计方向，并非餐馆正式网站。营业信息和菜单请向商家确认。"}
        </span>
      </aside>

      <ContactPanel
        compact
        language={language}
        subject={`Portfolio enquiry: ${profile.nameEn}`}
      />
      <MobileActionDock profile={profile} current="home" />
    </main>
  );
}
