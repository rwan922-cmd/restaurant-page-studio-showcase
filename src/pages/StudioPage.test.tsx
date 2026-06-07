import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PortfolioLanguageProvider } from "../i18n/portfolioLanguage";
import { StudioPage } from "./StudioPage";

function renderStudioPage() {
  return render(
    <PortfolioLanguageProvider path="/studio">
      <StudioPage />
    </PortfolioLanguageProvider>
  );
}

describe("StudioPage", () => {
  it("reports invalid profile data before export", async () => {
    const user = userEvent.setup();
    renderStudioPage();

    const slugInput = screen.getByLabelText(/预览 slug/i);
    await user.clear(slugInput);
    await user.type(slugInput, "Bad Slug!");

    expect(screen.getByRole("alert")).toHaveTextContent(/slug/i);
    expect(
      screen.getByRole("button", { name: /下载 JSON/i })
    ).toBeDisabled();
  });

  it("updates the live preview and export JSON from form fields", async () => {
    const user = userEvent.setup();
    renderStudioPage();

    const nameInput = screen.getByLabelText(/中文店名/i);
    await user.clear(nameInput);
    await user.type(nameInput, "金味坊");

    expect(
      screen.getByRole("heading", { name: /金味坊/i })
    ).toBeInTheDocument();
    expect(
      (screen.getByLabelText(/导出 JSON/i) as HTMLTextAreaElement).value
    ).toContain('"nameZh": "金味坊"');
    expect(
      screen.getByRole("button", { name: /下载 JSON/i })
    ).toBeEnabled();
  });

  it("edits grouped menus, media, menu status, opening hours and locations", () => {
    renderStudioPage();

    fireEvent.change(screen.getByLabelText(/分类菜单 JSON/i), {
      target: {
        value: JSON.stringify([
          {
            titleZh: "聚会套餐",
            titleEn: "Group menus",
            dishes: [
              {
                nameZh: "四人分享餐",
                nameEn: "Sharing menu for four",
                descriptionZh: "适合四人分享的概念套餐。",
                descriptionEn: "A concept sharing menu for four guests.",
                image: {
                  desktopSrc: "/media/shu-xiang/scene-1.webp",
                  mobileSrc: "/media/shu-xiang/scene-1-mobile.webp",
                  altZh: "四人分享餐概念画面",
                  altEn: "Concept image of a sharing menu",
                  captionZh: "概念画面，非商家实拍",
                  captionEn: "Concept image, not a merchant photograph",
                  sourceType: "concept"
                }
              }
            ]
          }
        ])
      }
    });
    fireEvent.change(screen.getByLabelText(/菜单资料状态/i), {
      target: { value: "merchant-confirmed" }
    });
    fireEvent.change(screen.getByLabelText(/营业时间 JSON/i), {
      target: {
        value: JSON.stringify([
          {
            labelZh: "周一至周日",
            valueZh: "17:00–23:00"
          }
        ])
      }
    });
    fireEvent.change(screen.getByLabelText(/门店 JSON/i), {
      target: {
        value: JSON.stringify([
          {
            nameZh: "市中心店",
            address: "10 Queen Street, Auckland"
          }
        ])
      }
    });

    expect(
      screen.getByRole("heading", { name: /聚会套餐/i })
    ).toBeInTheDocument();
    expect(screen.getByText("17:00–23:00")).toBeInTheDocument();
    expect(screen.getByText("10 Queen Street, Auckland")).toBeInTheDocument();
    expect(
      (screen.getByLabelText(/导出 JSON/i) as HTMLTextAreaElement).value
    ).toContain('"titleZh": "聚会套餐"');
    expect(
      (screen.getByLabelText(/导出 JSON/i) as HTMLTextAreaElement).value
    ).toContain('"menuStatus": "merchant-confirmed"');
    expect(screen.getByLabelText(/首屏图片 JSON/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/精选照片 JSON/i)).toBeInTheDocument();
  });
});
