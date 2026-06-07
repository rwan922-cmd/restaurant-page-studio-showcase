import { useEffect, useMemo, useState } from "react";
import { FoodImage } from "../components/FoodImage";
import { MobileActionDock } from "../components/MobileActionDock";
import type { RestaurantProfile } from "../domain/restaurant";
import {
  LanguageToggle,
  usePortfolioLanguage
} from "../i18n/portfolioLanguage";

type MenuPageProps = {
  profile: RestaurantProfile;
};

function normaliseSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function MenuPage({ profile }: MenuPageProps) {
  const [query, setQuery] = useState("");
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

  const filteredSections = useMemo(() => {
    const search = normaliseSearch(query);
    if (!search) {
      return profile.menuSections;
    }

    return profile.menuSections
      .map((section) => ({
        ...section,
        dishes: section.dishes.filter((dish) =>
          [
            dish.nameZh,
            dish.nameEn,
            dish.descriptionZh,
            dish.descriptionEn
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(search)
        )
      }))
      .filter((section) => section.dishes.length > 0);
  }, [profile.menuSections, query]);

  const hasResults = filteredSections.length > 0;
  const resultCount = filteredSections.reduce(
    (total, section) => total + section.dishes.length,
    0
  );

  return (
    <main
      id="main-content"
      className={`menu-page theme-${profile.theme}`}
    >
      <header className="menu-page__header">
        <FoodImage
          asset={profile.heroImages[0]}
          className="menu-page__hero-image"
          priority
        />
        <div className="menu-page__header-overlay" />
        <div className="menu-page__header-content">
          <div className="menu-page__toolbar">
            <LanguageToggle />
          </div>
          <a href={`/p/${profile.slug}`} className="menu-page__back">
            {isEnglish ? "Back to restaurant home" : "返回餐厅主页"}
          </a>
          <p className="section-label">
            {isEnglish ? profile.nameEn : profile.nameZh}
          </p>
          <h1>
            {isEnglish ? "Full menu" : "完整菜单"}
            <span>{isEnglish ? "完整菜单" : "Full menu"}</span>
          </h1>
          <p>
            {profile.menuStatus === "merchant-confirmed"
              ? isEnglish
                ? "Menu confirmed by the merchant."
                : "菜单内容已由商家确认。"
              : isEnglish
                ? "Concept selection. The full menu should be confirmed by the merchant."
                : "概念精选。完整菜单由商家确认后上线。"}
          </p>
          <label className="menu-search">
            <span>{isEnglish ? "Search dishes" : "搜索菜品"}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isEnglish ? "Search dish or keyword" : "输入菜名或关键词"
              }
            />
          </label>
          <p className="menu-search__status" role="status" aria-live="polite">
            {isEnglish
              ? query
                ? `${resultCount} result${resultCount === 1 ? "" : "s"}`
                : `${resultCount} dishes`
              : query
                ? `找到 ${resultCount} 道菜`
                : `共 ${resultCount} 道菜`}
          </p>
        </div>
      </header>

      {!query && (
        <nav
          className="menu-category-nav"
          aria-label={isEnglish ? "Menu categories" : "菜单分类"}
        >
          {profile.menuSections.map((section, index) => (
            <a href={`#menu-section-${index}`} key={section.titleZh}>
              {isEnglish ? section.titleEn : section.titleZh}
              <span>{isEnglish ? section.titleZh : section.titleEn}</span>
            </a>
          ))}
        </nav>
      )}

      <div className="full-menu">
        {hasResults ? (
          filteredSections.map((section, sectionIndex) => (
            <section
              className="full-menu__section"
              id={`menu-section-${sectionIndex}`}
              key={section.titleZh}
            >
              <div className="full-menu__section-heading">
                <p className="section-label">
                  {isEnglish ? "Category" : "菜单分类"}
                </p>
                <h2>
                  {isEnglish ? section.titleEn : section.titleZh}
                  <span>{isEnglish ? section.titleZh : section.titleEn}</span>
                </h2>
              </div>
              <div className="menu-card-grid">
                {section.dishes.map((dish) => (
                  <article className="menu-card" key={dish.nameZh}>
                    <FoodImage asset={dish.image} />
                    <div className="menu-card__body">
                      <div className="menu-card__title">
                        <h3>
                          {isEnglish ? dish.nameEn : dish.nameZh}
                          <span>{isEnglish ? dish.nameZh : dish.nameEn}</span>
                        </h3>
                        <strong>
                          {dish.price
                            ? `NZ$${dish.price.toFixed(2)}`
                            : isEnglish
                              ? "Confirm price"
                              : "价格请确认"}
                        </strong>
                      </div>
                      <p>
                        {isEnglish ? dish.descriptionEn : dish.descriptionZh}
                      </p>
                      <p lang={isEnglish ? "zh-CN" : "en"}>
                        {isEnglish ? dish.descriptionZh : dish.descriptionEn}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className="menu-empty" aria-live="polite">
            <h2>
              {isEnglish ? "No dishes match this search" : "没有找到匹配菜品"}
            </h2>
            <p>
              {isEnglish
                ? "Try another keyword."
                : "可以换一个菜名或关键词再试。"}
            </p>
            <button type="button" onClick={() => setQuery("")}>
              {isEnglish ? "Clear search" : "清除搜索"}
            </button>
          </section>
        )}
      </div>

      <MobileActionDock profile={profile} current="menu" />
    </main>
  );
}
