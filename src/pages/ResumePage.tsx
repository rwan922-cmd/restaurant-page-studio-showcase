import { buildMailto, contactConfig } from "../config/contact";
import {
  LanguageToggle,
  usePortfolioLanguage,
  type PortfolioLanguage
} from "../i18n/portfolioLanguage";

const resumeCopy = {
  en: {
    navLabel: "Resume navigation",
    home: "Portfolio home",
    project: "Restaurant project",
    kicker: "AUCKLAND · AVAILABLE FOR PART-TIME EMPLOYMENT",
    name: "Ruiqiao Wang",
    role: "Student Full-Stack Developer",
    education:
      "Bachelor of Science, double major in Computer Science and Information and Technology Management",
    university: "University of Auckland",
    graduation: "Expected June 2029",
    summary:
      "I build responsive web products with React, TypeScript and Cloudflare. My work combines product thinking, tested interfaces, serverless APIs and clear bilingual communication.",
    email: "Email Ruiqiao",
    viewProject: "View restaurant project",
    projectLabel: "Selected project",
    projectTitle: "Restaurant Page Studio",
    projectIntro:
      "An independently designed and developed portfolio prototype for bilingual restaurant discovery and reservation management.",
    projectPoints: [
      "Responsive restaurant, menu, reservation and merchant workspace experiences.",
      "Cloudflare Functions API with D1 persistence and protected merchant sessions.",
      "Merchant-confirmed reservations without online ordering or payment.",
      "Runtime validation plus automated route, privacy and interaction testing.",
      "AI-assisted development with architecture, debugging, tests and final decisions owned by me."
    ],
    projectNote:
      "Concept project only. It is not client work and does not accept commercial restaurant orders.",
    skillsLabel: "Technical skills",
    skillsTitle: "Full-stack foundations with a product mindset",
    skills: [
      "React 19, TypeScript and Vite",
      "Cloudflare Pages, Functions and D1",
      "Runtime validation with Zod",
      "Vitest and Testing Library",
      "Responsive UI and WCAG 2.2 AA accessibility",
      "Bilingual Chinese and English product communication"
    ],
    directionLabel: "Current direction",
    directionTitle: "Building toward software and AI",
    direction:
      "I am strengthening algorithms, mathematics and data foundations alongside full-stack engineering, with the long-term goal of postgraduate study in artificial intelligence.",
    workLabel: "Work eligibility",
    workTitle: "Part-time employee roles in Auckland",
    workOne:
      "New Zealand student visa holder, available for lawful employment up to 25 hours per week, subject to visa conditions.",
    workTwo:
      "Seeking employee roles in software development, frontend development, web operations, IT support or bilingual digital work. Not available for self-employment or independent contracting.",
    github: "GitHub profile",
    footer: "Ruiqiao Wang · Auckland, New Zealand",
    footerLink: "View full portfolio"
  },
  zh: {
    navLabel: "简历导航",
    home: "作品集首页",
    project: "餐厅项目",
    kicker: "AUCKLAND · 可受雇从事兼职工作",
    name: "王睿桥 · Ruiqiao Wang",
    role: "学生全栈开发者",
    education:
      "理学学士双专业：计算机科学、信息与技术管理",
    university: "奥克兰大学 · University of Auckland",
    graduation: "预计 2029 年 6 月毕业",
    summary:
      "我使用 React、TypeScript 与 Cloudflare 构建响应式 Web 产品，将产品思考、经过测试的界面、无服务器 API 和清晰的双语沟通结合起来。",
    email: "邮件联系",
    viewProject: "查看餐厅项目",
    projectLabel: "代表项目",
    projectTitle: "Restaurant Page Studio",
    projectIntro:
      "一个独立设计与开发的双语餐厅展示、菜单和订位管理作品集原型。",
    projectPoints: [
      "适配手机和电脑的餐厅、菜单、订位与商家工作台。",
      "使用 Cloudflare Functions、D1 持久化与受保护商家会话。",
      "由商家确认订位，不包含在线点餐或支付。",
      "包含运行时校验，以及路由、隐私和交互自动化测试。",
      "使用 AI 辅助开发，但架构、调试、测试和最终决策由我负责。"
    ],
    projectNote:
      "这是概念作品，不属于客户项目，也不接受餐厅商业订单。",
    skillsLabel: "技术能力",
    skillsTitle: "以产品思维学习全栈工程",
    skills: [
      "React 19、TypeScript 与 Vite",
      "Cloudflare Pages、Functions 与 D1",
      "使用 Zod 进行运行时校验",
      "Vitest 与 Testing Library",
      "响应式界面与 WCAG 2.2 AA 无障碍",
      "中文与英文双语产品沟通"
    ],
    directionLabel: "发展方向",
    directionTitle: "从软件工程走向人工智能",
    direction:
      "我正在全栈工程之外加强算法、数学和数据基础，长期目标是申请人工智能方向的研究生项目。",
    workLabel: "工作资格",
    workTitle: "寻找 Auckland 兼职雇员岗位",
    workOne:
      "持有新西兰学生签证，可按签证条件每周受雇工作最多 25 小时。",
    workTwo:
      "寻找软件开发、前端开发、网站运营、IT 支持或双语数字岗位，不接受自雇或独立承包工作。",
    github: "GitHub 主页",
    footer: "王睿桥 · 新西兰奥克兰",
    footerLink: "查看完整作品集"
  }
} as const satisfies Record<PortfolioLanguage, object>;

export function ResumePage() {
  const { language } = usePortfolioLanguage();
  const text = resumeCopy[language];

  return (
    <main id="main-content" className="resume-page">
      <header className="resume-hero">
        <div className="resume-nav-row">
          <nav aria-label={text.navLabel}>
            <a href="/">{text.home}</a>
            <a href="/p/shu-xiang">{text.project}</a>
          </nav>
          <LanguageToggle />
        </div>
        <p className="resume-kicker">{text.kicker}</p>
        <h1>{text.name}</h1>
        <p className="resume-role">{text.role}</p>
        <div className="resume-education">
          <strong>{text.university}</strong>
          <span>{text.education}</span>
          <span>{text.graduation}</span>
        </div>
        <p className="resume-summary">{text.summary}</p>
        <div className="resume-actions">
          <a
            className="button button--primary"
            href={buildMailto("Part-time full-stack employment opportunity")}
          >
            {text.email}
          </a>
          <a className="button button--ghost" href="/p/shu-xiang">
            {text.viewProject}
          </a>
        </div>
      </header>

      <section className="resume-section resume-project">
        <div>
          <p className="section-label">{text.projectLabel}</p>
          <h2>{text.projectTitle}</h2>
        </div>
        <div className="resume-project__body">
          <p>{text.projectIntro}</p>
          <ul>
            {text.projectPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="resume-note">{text.projectNote}</p>
        </div>
      </section>

      <section className="resume-section resume-skills">
        <div>
          <p className="section-label">{text.skillsLabel}</p>
          <h2>{text.skillsTitle}</h2>
        </div>
        <ul>
          {text.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </section>

      <section className="resume-section resume-direction">
        <div>
          <p className="section-label">{text.directionLabel}</p>
          <h2>{text.directionTitle}</h2>
        </div>
        <p>{text.direction}</p>
      </section>

      <section className="resume-section resume-availability">
        <div>
          <p className="section-label">{text.workLabel}</p>
          <h2>{text.workTitle}</h2>
        </div>
        <div>
          <p>{text.workOne}</p>
          <p>{text.workTwo}</p>
          <div className="resume-contact-links">
            <a href={`mailto:${contactConfig.email}`} className="resume-email">
              {contactConfig.email}
            </a>
            <a
              href="https://github.com/rwan922-cmd"
              target="_blank"
              rel="noreferrer"
            >
              {text.github}
            </a>
          </div>
        </div>
      </section>

      <footer className="resume-footer">
        <span>{text.footer}</span>
        <a href="/">{text.footerLink}</a>
      </footer>
    </main>
  );
}
