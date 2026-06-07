import { ContactPanel } from "../components/ContactPanel";
import { FoodImage } from "../components/FoodImage";
import {
  LanguageToggle,
  usePortfolioLanguage,
  type PortfolioLanguage
} from "../i18n/portfolioLanguage";
import type { ImageAsset } from "../domain/restaurant";

const heroImage: ImageAsset = {
  desktopSrc: "/media/home/charcoal.webp",
  mobileSrc: "/media/home/charcoal-mobile.webp",
  altZh: "炭火烧烤概念画面",
  altEn: "Concept image of charcoal barbecue",
  captionZh: "匿名原创概念画面",
  captionEn: "Anonymous original concept image",
  sourceType: "concept"
};

const showcaseImages: ImageAsset[] = [
  {
    desktopSrc: "/media/home/table.webp",
    mobileSrc: "/media/home/table-mobile.webp",
    altZh: "多人中式聚餐概念画面",
    altEn: "Concept image of a Chinese group dinner",
    captionZh: "菜单、照片与订位入口在同一产品中呈现",
    captionEn: "Menu, imagery and reservations in one product",
    sourceType: "concept"
  },
  {
    desktopSrc: "/media/home/grill.webp",
    mobileSrc: "/media/home/grill-mobile.webp",
    altZh: "炭火烤蔬菜概念画面",
    altEn: "Concept image of vegetables on a charcoal grill",
    captionZh: "使用原创概念图，不复制商家素材",
    captionEn: "Original concept media, not copied merchant assets",
    sourceType: "concept"
  }
];

const copy = {
  en: {
    brandLabel: "Restaurant Page Studio home",
    navLabel: "Portfolio navigation",
    navProject: "Project",
    navDemo: "Demo",
    navResume: "Resume",
    kicker: "AUCKLAND · STUDENT FULL-STACK DEVELOPER",
    title: "I build complete products, not isolated screens.",
    lead:
      "Restaurant Page Studio connects bilingual discovery, visual menus, customer reservations and a protected merchant workspace in one tested web product.",
    statusTitle: "Portfolio prototype",
    statusText:
      "I am not accepting commercial orders. I am seeking lawful part-time employee roles in Auckland while completing my degree.",
    caseStudyAction: "Read the case study",
    demoAction: "View restaurant demo",
    proofOne:
      "React 19, TypeScript, Zod, Vitest, Cloudflare Functions and D1.",
    proofTwo:
      "Read-only menus, merchant-confirmed reservations and disabled real notifications in the public demo.",
    heroCaption: "A product decision starts before the first click.",
    conceptCaption: "Original concept image, not merchant photography.",
    projectLabel: "Selected project",
    projectTitle:
      "One product path from a diner’s first visit to a merchant’s confirmation.",
    capabilities: [
      [
        "Product design",
        "Bilingual information architecture, mobile navigation and menu search are organised around real dining decisions."
      ],
      [
        "Frontend engineering",
        "Responsive React and TypeScript interfaces use runtime validation, accessible controls and automated interaction tests."
      ],
      [
        "Cloudflare backend",
        "Pages Functions and D1 persist reservation requests, protect merchant sessions and keep customer status links private."
      ]
    ],
    showcaseLabel: "Working product",
    showcaseTitle: "The interface explains the system by letting people use it.",
    showcaseText:
      "The anonymous demo includes restaurant discovery, a searchable bilingual menu, reservation rules, customer status and a merchant counter workflow.",
    showcaseAction: "Open the complete restaurant demo",
    processLabel: "Engineering evidence",
    processTitle: "The case study records decisions, not just the final screen.",
    process: [
      [
        "Problem framing",
        "Mapped customer and merchant needs before choosing the routes and data model."
      ],
      [
        "Full-stack implementation",
        "Built the responsive client, validation, API operations, D1 persistence and protected sessions."
      ],
      [
        "Verification",
        "Used test-driven development, keyboard checks, reduced motion and multi-viewport browser review."
      ],
      [
        "AI-assisted workflow",
        "Used AI to accelerate research and implementation while retaining responsibility for architecture, debugging, tests and final decisions."
      ]
    ],
    disclaimer:
      "This is an independent portfolio prototype. It is not client work, does not represent merchant authorisation and does not accept commercial orders.",
    footer: "Ruiqiao Wang · University of Auckland · Expected June 2029"
  },
  zh: {
    brandLabel: "Restaurant Page Studio 首页",
    navLabel: "作品集导航",
    navProject: "项目",
    navDemo: "演示",
    navResume: "简历",
    kicker: "AUCKLAND · 学生全栈开发者",
    title: "把餐厅体验做成一个完整的双语产品。",
    lead:
      "Restaurant Page Studio 将双语品牌展示、图文菜单、顾客订位和受保护的商家工作台连接成一个经过测试的 Web 产品。",
    statusTitle: "作品集原型",
    statusText:
      "目前不接受商业订单。我在完成学位期间，正在寻找符合学生签证条件的 Auckland 兼职雇员岗位。",
    caseStudyAction: "阅读项目案例",
    demoAction: "查看餐厅演示",
    proofOne:
      "React 19、TypeScript、Zod、Vitest、Cloudflare Functions 与 D1。",
    proofTwo:
      "菜单只读，订位由商家确认，公开演示不会发送真实通知。",
    heroCaption: "顾客作出选择，始于第一次点击之前。",
    conceptCaption: "原创概念画面，非商家实拍。",
    projectLabel: "代表项目",
    projectTitle: "从顾客首次访问，到商家确认订位的一条完整产品路径。",
    capabilities: [
      [
        "产品设计",
        "用双语信息架构、移动端导航和菜单搜索支持真实的用餐决策。"
      ],
      [
        "前端工程",
        "使用 React、TypeScript、运行时校验、无障碍控件和自动化交互测试实现响应式界面。"
      ],
      [
        "Cloudflare 后端",
        "通过 Pages Functions 与 D1 保存订位、保护商家会话，并避免状态链接泄露顾客资料。"
      ]
    ],
    showcaseLabel: "可运行产品",
    showcaseTitle: "不靠静态效果图，让使用过程本身说明系统。",
    showcaseText:
      "匿名演示包含餐厅展示、双语菜单搜索、订位规则、顾客状态查询和商家工作台流程。",
    showcaseAction: "打开完整餐厅演示",
    processLabel: "工程证据",
    processTitle: "案例记录的不只是页面，还有我为什么这样实现。",
    process: [
      ["问题定义", "先整理顾客与商家的需求，再确定路由、流程和数据模型。"],
      [
        "全栈实现",
        "完成响应式前端、数据校验、API、D1 持久化和受保护会话。"
      ],
      [
        "验证",
        "使用测试驱动开发、键盘检查、减少动态效果和多视口浏览器验收。"
      ],
      [
        "AI 辅助开发",
        "使用 AI 加速研究与实现，但架构、调试、测试和最终决策由我负责。"
      ]
    ],
    disclaimer:
      "这是独立作品集原型，不属于客户项目，不代表商家授权，也不接受商业订单。",
    footer: "王睿桥 · 奥克兰大学 · 预计 2029 年 6 月毕业"
  }
} as const satisfies Record<PortfolioLanguage, object>;

export function HomePage() {
  const { language } = usePortfolioLanguage();
  const text = copy[language];

  return (
    <main id="main-content" className="sales-page">
      <header className="sales-nav">
        <a
          className="sales-nav__brand"
          href="/"
          aria-label={text.brandLabel}
        >
          <span>RUIQIAO WANG</span>
          <strong>FULL-STACK PORTFOLIO</strong>
        </a>
        <div className="sales-nav__actions">
          <nav aria-label={text.navLabel}>
            <a href="#project">{text.navProject}</a>
            <a href="/p/shu-xiang">{text.navDemo}</a>
            <a href="/resume">{text.navResume}</a>
          </nav>
          <LanguageToggle />
        </div>
      </header>

      <section className="sales-hero">
        <div className="sales-hero__copy">
          <div>
            <p className="sales-kicker">{text.kicker}</p>
            <h1>{text.title}</h1>
            <p className="sales-hero__lead">{text.lead}</p>
            <div className="portfolio-status">
              <strong>{text.statusTitle}</strong>
              <span>{text.statusText}</span>
            </div>
            <div className="hero-actions">
              <a className="button button--primary" href="#project">
                {text.caseStudyAction}
              </a>
              <a className="button button--ghost" href="/p/shu-xiang">
                {text.demoAction}
              </a>
            </div>
          </div>
          <div className="sales-proof">
            <p>{text.proofOne}</p>
            <p>{text.proofTwo}</p>
          </div>
        </div>

        <figure className="sales-hero__visual">
          <FoodImage asset={heroImage} priority />
          <figcaption>
            <strong>{text.heroCaption}</strong>
            <span>{text.conceptCaption}</span>
          </figcaption>
        </figure>
      </section>

      <section className="service-section" id="project">
        <div className="service-section__heading">
          <p className="section-label">{text.projectLabel}</p>
          <h2>{text.projectTitle}</h2>
        </div>
        <div className="service-list">
          {text.capabilities.map(([title, description]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-section" aria-labelledby="showcase-title">
        <div className="showcase-section__copy">
          <p className="section-label">{text.showcaseLabel}</p>
          <h2 id="showcase-title">{text.showcaseTitle}</h2>
          <p>{text.showcaseText}</p>
          <a href="/p/shu-xiang">{text.showcaseAction}</a>
        </div>
        <div className="showcase-images">
          {showcaseImages.map((image) => (
            <figure key={image.desktopSrc}>
              <FoodImage asset={image} />
              <figcaption>
                {language === "en" ? image.captionEn : image.captionZh}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="process-section">
        <div>
          <p className="section-label">{text.processLabel}</p>
          <h2>{text.processTitle}</h2>
        </div>
        <ol>
          {text.process.map(([title, description]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{description}</span>
            </li>
          ))}
        </ol>
        <p className="domain-note">{text.disclaimer}</p>
      </section>

      <div id="contact">
        <ContactPanel language={language} />
      </div>

      <footer className="sales-footer">
        <span>{text.footer}</span>
        <a href="mailto:wangruiqiao7@gmail.com">wangruiqiao7@gmail.com</a>
      </footer>
    </main>
  );
}
