import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoodImage } from "./FoodImage";

const asset = {
  desktopSrc: "/media/test/scene-1.webp",
  mobileSrc: "/media/test/scene-1-mobile.webp",
  altZh: "菜品概念画面",
  altEn: "Concept food image",
  captionZh: "概念画面，非商家实拍",
  captionEn: "Concept image, not a merchant photograph",
  sourceType: "concept" as const
};

describe("FoodImage", () => {
  it("shows a labelled fallback when an image cannot load", () => {
    render(<FoodImage asset={asset} />);

    fireEvent.error(screen.getByRole("img"));

    expect(screen.getByText(/图片暂不可用/i)).toBeInTheDocument();
  });

  it("uses eager loading only when explicitly prioritised", () => {
    const { rerender } = render(<FoodImage asset={asset} priority />);
    const priorityImage = screen.getByRole("img");
    expect(priorityImage).toHaveAttribute("loading", "eager");
    expect(priorityImage).toHaveAttribute("fetchpriority", "high");
    expect(priorityImage).toHaveAttribute("decoding", "async");

    rerender(<FoodImage asset={asset} />);
    const lazyImage = screen.getByRole("img");
    expect(lazyImage).toHaveAttribute("loading", "lazy");
    expect(lazyImage).toHaveAttribute("fetchpriority", "auto");
  });
});
