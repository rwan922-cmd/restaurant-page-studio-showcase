import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { restaurants } from "./data/restaurants";

describe("App routes", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("presents the project as a student portfolio rather than a commercial service", () => {
    render(<App path="/" />);

    expect(
      screen.getByRole("heading", {
        name: /I build complete products, not isolated screens/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/not accepting commercial orders/i).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/NZ\$(?:99|199|29)/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Email Ruiqiao/i })
    ).toHaveAttribute("href", expect.stringContaining("wangruiqiao7@gmail.com"));
    expect(
      screen.getByRole("link", { name: /GitHub profile/i })
    ).toHaveAttribute("href", "https://github.com/rwan922-cmd");
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("switches the portfolio to Chinese and remembers the choice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App path="/" />);

    await user.click(
      screen.getByRole("button", { name: /Switch to Chinese/i })
    );

    expect(
      screen.getByRole("heading", {
        name: /把餐厅体验做成一个完整的双语产品/i
      })
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("portfolio-language")).toBe("zh");
    expect(document.documentElement).toHaveAttribute("lang", "zh-CN");

    unmount();
    render(<App path="/resume" />);

    expect(
      screen.getByRole("heading", { name: /王睿桥.*Ruiqiao Wang/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /切换到英文/i })
    ).toBeInTheDocument();
  });

  it("uses anonymous food imagery and a useful marketing navigation", () => {
    render(<App path="/" />);

    expect(
      screen.getByRole("img", { name: /炭火烧烤概念画面/i })
    ).toHaveAttribute("src", expect.stringMatching(/^\/media\/home\//));
    expect(screen.getByRole("link", { name: /View restaurant demo/i })).toHaveAttribute(
      "href",
      "/p/shu-xiang"
    );
    expect(screen.getByRole("link", { name: /Read the case study/i })).toHaveAttribute(
      "href",
      "#project"
    );
    expect(screen.queryByText(/炙味聚场/i)).not.toBeInTheDocument();
  });

  it("provides a keyboard skip link on every route", () => {
    const { rerender } = render(<App path="/" />);

    expect(
      screen.getByRole("link", { name: /Skip to main content/i })
    ).toHaveAttribute("href", "#main-content");
    expect(document.querySelector("main")).toHaveAttribute(
      "id",
      "main-content"
    );

    rerender(<App path="/p/shu-xiang/menu" />);
    expect(document.querySelector("main")).toHaveAttribute(
      "id",
      "main-content"
    );
  });

  it("renders the matching restaurant preview and concept disclaimer", () => {
    render(<App path="/p/shu-xiang" />);

    expect(
      screen.getByRole("heading", { name: /Shu Xiang/i })
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Call/i })
        .some((link) => link.getAttribute("href") === "tel:+6495550123")
    ).toBe(true);
    expect(screen.getByRole("link", { name: /Directions/i })).toHaveAttribute(
      "href",
      expect.stringContaining("maps.google.com")
    );
    expect(screen.getByText(/Unofficial concept demo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This independent concept demonstrates product design/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/NZ\$99 起/i)).not.toBeInTheDocument();
  });

  it("defaults restaurant previews to English and can switch them to Chinese", async () => {
    const user = userEvent.setup();
    render(<App path="/p/shu-xiang" />);

    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(
      screen.getByRole("button", { name: /Switch to Chinese/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Brand story/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /品牌介绍/i })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Switch to Chinese/i })
    );

    expect(document.documentElement).toHaveAttribute("lang", "zh-CN");
    expect(
      screen.getByRole("heading", { name: /品牌介绍/i })
    ).toBeInTheDocument();
  });

  it("provides an English resume for lawful part-time employment", () => {
    render(<App path="/resume" />);

    expect(
      screen.getByRole("heading", { name: /Ruiqiao Wang/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Student Full-Stack Developer/i)).toBeInTheDocument();
    expect(
      screen.getByText(/University of Auckland/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Computer Science and Information and Technology Management/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Expected June 2029/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 25 hours per week/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View restaurant project/i })
    ).toHaveAttribute("href", "/p/shu-xiang");
    expect(
      screen.getByRole("link", { name: /Email Ruiqiao/i })
    ).toHaveAttribute("href", expect.stringContaining("wangruiqiao7@gmail.com"));
  });

  it("shows a friendly error for an unknown preview slug", () => {
    render(<App path="/p/not-a-real-restaurant" />);

    expect(
      screen.getByRole("heading", { name: /找不到这个预览/i })
    ).toBeInTheDocument();
  });

  it("keeps the studio unavailable when development tools are disabled", () => {
    render(<App path="/studio" studioEnabled={false} />);

    expect(
      screen.getByRole("heading", { name: /找不到这个页面/i })
    ).toBeInTheDocument();
  });

  it("renders the anonymous restaurant demo with full restaurant information", () => {
    render(<App path="/p/shu-xiang" />);

    expect(
      screen.getByRole("heading", { name: /Shu Xiang/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Brand story/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Opening hours/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /^Location$/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Confirm price/i).length
    ).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: /Book a table/i })
        .some((link) => link.getAttribute("href") === "/p/shu-xiang/reserve")
    ).toBe(true);
    expect(
      screen.queryByRole("link", { name: /在线点餐|平台菜单/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Unofficial concept demo/i)).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Full menu/i })
        .some(
          (link) =>
            link.getAttribute("href") === "/p/shu-xiang/menu"
        )
    ).toBe(true);
    expect(screen.getAllByTestId("hero-image")).toHaveLength(3);
    expect(screen.getAllByTestId("gallery-image")).toHaveLength(6);
    expect(screen.getByText(/Concept image, not a merchant photograph/i)).toBeInTheDocument();
  });

  it("keeps the same mobile action dock on the restaurant and menu pages", () => {
    const { rerender } = render(<App path="/p/shu-xiang" />);

    const previewDock = screen.getByRole("navigation", {
      name: /Mobile quick actions/i
    });
    expect(previewDock).toHaveTextContent(/Home/);
    expect(previewDock).toHaveTextContent(/Menu/);
    expect(previewDock).toHaveTextContent(/Book/);
    expect(previewDock).toHaveTextContent(/Contact/);
    expect(
      screen
        .getAllByRole("link", { name: /Book a table/i })
        .some((link) => link.getAttribute("href") === "/p/shu-xiang/reserve")
    ).toBe(true);

    rerender(<App path="/p/shu-xiang/menu" />);
    expect(
      screen.getByRole("navigation", { name: /Mobile quick actions/i })
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Back to restaurant home/i })
        .some(
          (link) =>
            link.getAttribute("href") === "/p/shu-xiang"
        )
    ).toBe(true);
  });

  it("uses the internal reservation page when no external booking link exists", () => {
    render(<App path="/p/shu-xiang" />);

    expect(
      screen
        .getAllByRole("link", { name: /Book a table/i })
        .some((link) => link.getAttribute("href") === "/p/shu-xiang/reserve")
    ).toBe(true);
  });

  it("renders the internal reservation form with required dining details", () => {
    render(<App path="/p/shu-xiang/reserve" />);

    expect(
      screen.getByRole("heading", { name: /Reserve a table.*预定座位/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Switch to Chinese/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Date.*日期/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time.*时间/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Guests.*人数/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Seating area.*就餐区域/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name.*姓名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notification.*通知方式/i)).toBeInTheDocument();
  });

  it("renders a searchable internal menu page", async () => {
    const user = userEvent.setup();
    render(<App path="/p/shu-xiang/menu" />);

    expect(
      screen.getByRole("heading", { name: /Full menu/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Spicy beef soup.*香辣牛肉汤/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Concept selection/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Switch to Chinese/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search dish or keyword/i)
    ).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "dan dan");

    expect(
      screen.getByRole("heading", { name: /Dan dan noodles.*手工担担面/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/1 result/i);
    expect(
      screen.queryByRole("heading", { name: /香辣牛肉汤/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /平台菜单|在线点餐/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /加入|购物车|下单/i })
    ).not.toBeInTheDocument();
  });

  it("renders the merchant reservation login route", () => {
    render(<App path="/counter/login" />);

    expect(
      screen.getByRole("heading", { name: /商家订位工作台/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/邮箱.*Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码或员工 PIN/i)).toBeInTheDocument();
  });

  it("shows a friendly empty state when menu search has no matches", async () => {
    const user = userEvent.setup();
    render(<App path="/p/shu-xiang/menu" />);

    await user.type(screen.getByRole("searchbox"), "not on menu");

    expect(screen.getByText(/No dishes match this search/i)).toBeInTheDocument();
  });

  it("marks restaurant previews as noindex", () => {
    render(<App path="/p/shu-xiang" />);

    expect(
      document.head.querySelector('meta[name="robots"]')
    ).toHaveAttribute("content", "noindex, nofollow");
  });

  it("keeps the public home page focused on anonymous demo content", () => {
    render(<App path="/" />);

    expect(screen.getByRole("link", { name: /View restaurant demo/i })).toHaveAttribute(
      "href",
      "/p/shu-xiang"
    );
    expect(screen.queryByText(/target merchant/i)).not.toBeInTheDocument();
  });

  it("only exposes the anonymous restaurant demo in the public data set", () => {
    expect(Object.keys(restaurants)).toEqual(["shu-xiang"]);
  });

  it("provides complete media and menu data for every preview", () => {
    Object.values(restaurants).forEach((profile) => {
      expect(profile.heroImages, profile.slug).toHaveLength(3);
      expect(profile.galleryImages, profile.slug).toHaveLength(6);
      expect(profile.menuSections.length, profile.slug).toBeGreaterThan(0);
      profile.menuSections.forEach((section) => {
        section.dishes.forEach((dish) => {
          expect(dish.descriptionZh, `${profile.slug}:${dish.nameZh}`).toBeTruthy();
          expect(dish.descriptionEn, `${profile.slug}:${dish.nameZh}`).toBeTruthy();
          expect(dish.descriptionZh).not.toContain("概念菜单说明");
          expect(dish.descriptionEn).not.toContain("A concept menu description");
          expect(dish.image.desktopSrc).toMatch(/^\/media\//);
        });
      });
    });
  });
});
