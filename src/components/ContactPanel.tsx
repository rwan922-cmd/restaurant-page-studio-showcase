import { buildMailto } from "../config/contact";
import type { PortfolioLanguage } from "../i18n/portfolioLanguage";

type ContactPanelProps = {
  compact?: boolean;
  subject?: string;
  language?: PortfolioLanguage;
};

export function ContactPanel({
  compact = false,
  subject = "Full-stack employment opportunity",
  language
}: ContactPanelProps) {
  const isEnglish = language === "en";
  const isChinese = language === "zh";

  return (
    <section className={compact ? "contact-panel contact-panel--compact" : "contact-panel"}>
      <div>
        <p className="section-label">
          {isEnglish ? "Employment" : isChinese ? "工作机会" : "作品集 / Portfolio"}
        </p>
        <h2>
          {compact
            ? isEnglish
              ? "Portfolio project"
              : "作品集项目 / Portfolio project"
            : isEnglish
              ? "Open to part-time employee roles in Auckland."
              : "正在寻找 Auckland 的兼职雇员岗位。"}
        </h2>
        <p>
          {compact && isChinese
            ? "这个独立概念项目展示产品设计与全栈实现能力。它不是客户作品，也不接受商业订单。"
            : compact
              ? "This independent concept demonstrates product design and full-stack implementation. It is not client work and does not accept commercial orders."
              : isEnglish
              ? "I am a University of Auckland student available for lawful employment up to 25 hours per week, subject to my visa conditions. I am not available for self-employment or independent contracting."
              : "我是奥克兰大学学生，可按签证条件每周受雇工作最多 25 小时。目前不接受自雇、独立承包或商业订单。"}
        </p>
        <div className="contact-actions">
          <a className="button button--primary" href={buildMailto(subject)}>
            {isEnglish ? "Email Ruiqiao" : isChinese ? "邮件联系" : "Email Ruiqiao"}
          </a>
          {!compact && (
            <a
              className="button button--ghost"
              href="https://github.com/rwan922-cmd"
              target="_blank"
              rel="noreferrer"
              aria-label={isChinese ? "GitHub 主页" : "GitHub profile"}
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
