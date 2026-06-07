import { describe, expect, it } from "vitest";
import {
  contactConfigSchema,
  restaurantProfileSchema,
  validateRestaurantProfile
} from "./restaurant";

const validProfile = {
  slug: "shu-xiang",
  nameZh: "蜀香小馆",
  nameEn: "Shu Xiang",
  taglineZh: "正宗川味",
  taglineEn: "Authentic Sichuan Flavours",
  city: "Auckland",
  address: "88 Queen Street, Auckland CBD",
  openingStatusZh: "今日营业",
  openingStatusEn: "Open today",
  phone: "+64 9 555 0123",
  mapsUrl: "https://maps.google.com/?q=88+Queen+Street+Auckland",
  menuUrl: "https://example.com/menu",
  theme: "ember",
  menuStatus: "concept-selection",
  reservationEnabled: true,
  heroImages: [
    {
      desktopSrc: "/media/shu-xiang/hero-1.webp",
      mobileSrc: "/media/shu-xiang/hero-1-mobile.webp",
      altZh: "炭火烧烤概念画面",
      altEn: "Concept image of charcoal barbecue",
      captionZh: "概念画面，非商家实拍",
      captionEn: "Concept image, not a merchant photograph",
      sourceType: "concept"
    },
    {
      desktopSrc: "/media/shu-xiang/hero-2.webp",
      mobileSrc: "/media/shu-xiang/hero-2-mobile.webp",
      altZh: "多人聚餐概念画面",
      altEn: "Concept image of group dining",
      captionZh: "概念画面，非商家实拍",
      captionEn: "Concept image, not a merchant photograph",
      sourceType: "concept"
    },
    {
      desktopSrc: "/media/shu-xiang/hero-3.webp",
      mobileSrc: "/media/shu-xiang/hero-3-mobile.webp",
      altZh: "餐桌氛围概念画面",
      altEn: "Concept image of a dining table",
      captionZh: "概念画面，非商家实拍",
      captionEn: "Concept image, not a merchant photograph",
      sourceType: "concept"
    }
  ],
  galleryImages: Array.from({ length: 6 }, (_, index) => ({
    desktopSrc: `/media/shu-xiang/gallery-${index + 1}.webp`,
    mobileSrc: `/media/shu-xiang/gallery-${index + 1}-mobile.webp`,
    altZh: `精选概念画面 ${index + 1}`,
    altEn: `Selected concept image ${index + 1}`,
    captionZh: "概念画面，非商家实拍",
    captionEn: "Concept image, not a merchant photograph",
    sourceType: "concept"
  })),
  menuSections: [
    {
      titleZh: "招牌菜",
      titleEn: "Signatures",
      dishes: [
        {
          nameZh: "麻婆豆腐",
          nameEn: "Mapo tofu",
          descriptionZh: "麻辣风味的豆腐概念菜品介绍。",
          descriptionEn: "A concept description for a spicy tofu dish.",
          image: {
            desktopSrc: "/media/shu-xiang/gallery-1.webp",
            mobileSrc: "/media/shu-xiang/gallery-1-mobile.webp",
            altZh: "麻婆豆腐概念画面",
            altEn: "Concept image of mapo tofu",
            captionZh: "概念画面，非商家实拍",
            captionEn: "Concept image, not a merchant photograph",
            sourceType: "concept"
          },
          price: 18.8
        }
      ]
    }
  ]
};

describe("restaurantProfileSchema", () => {
  it("accepts a complete restaurant profile", () => {
    expect(restaurantProfileSchema.parse(validProfile)).toMatchObject({
      slug: "shu-xiang",
      city: "Auckland"
    });
  });

  it("rejects slugs that are not URL safe", () => {
    const result = restaurantProfileSchema.safeParse({
      ...validProfile,
      slug: "Shu Xiang!"
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive dish prices", () => {
    const result = validateRestaurantProfile({
      ...validProfile,
      menuSections: [
        {
          ...validProfile.menuSections[0],
          dishes: [{ ...validProfile.menuSections[0].dishes[0], price: 0 }]
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsafe external links", () => {
    const result = restaurantProfileSchema.safeParse({
      ...validProfile,
      mapsUrl: "javascript:alert(1)"
    });

    expect(result.success).toBe(false);
  });

  it("accepts grouped menus with descriptions, images and unconfirmed prices", () => {
    const result = restaurantProfileSchema.parse({
      ...validProfile,
      aboutZh: "从街坊熟悉的家常味出发，提供适合分享的中式餐点。",
      aboutEn:
        "Neighbourhood Chinese cooking built around familiar dishes for sharing.",
      menuSections: [
        {
          titleZh: "招牌菜",
          titleEn: "Signatures",
          dishes: [
            {
              ...validProfile.menuSections[0].dishes[0],
              nameZh: "香辣鸡",
              nameEn: "Spicy chicken",
              price: 22.8
            },
            {
              ...validProfile.menuSections[0].dishes[0],
              nameZh: "手工水饺",
              nameEn: "Handmade dumplings",
              price: undefined
            }
          ]
        }
      ]
    });

    expect(result.menuSections).toHaveLength(1);
    expect(result.menuSections?.[0].dishes[1].price).toBeUndefined();
  });

  it("requires every dish to include a bilingual description and image", () => {
    const dish = validProfile.menuSections[0].dishes[0];
    const withoutDescription = restaurantProfileSchema.safeParse({
      ...validProfile,
      menuSections: [
        {
          ...validProfile.menuSections[0],
          dishes: [{ ...dish, descriptionZh: undefined }]
        }
      ]
    });
    const withoutImage = restaurantProfileSchema.safeParse({
      ...validProfile,
      menuSections: [
        {
          ...validProfile.menuSections[0],
          dishes: [{ ...dish, image: undefined }]
        }
      ]
    });

    expect(withoutDescription.success).toBe(false);
    expect(withoutImage.success).toBe(false);
  });

  it("requires exactly three hero images and six gallery images", () => {
    expect(
      restaurantProfileSchema.safeParse({
        ...validProfile,
        heroImages: validProfile.heroImages.slice(0, 2)
      }).success
    ).toBe(false);
    expect(
      restaurantProfileSchema.safeParse({
        ...validProfile,
        galleryImages: validProfile.galleryImages.slice(0, 5)
      }).success
    ).toBe(false);
  });

  it("rejects remote or non-image media paths", () => {
    const result = restaurantProfileSchema.safeParse({
      ...validProfile,
      heroImages: [
        {
          ...validProfile.heroImages[0],
          desktopSrc: "https://merchant.example.com/photo.jpg"
        },
        ...validProfile.heroImages.slice(1)
      ]
    });

    expect(result.success).toBe(false);
  });

  it("accepts business hours, multiple locations and reservation links", () => {
    const result = restaurantProfileSchema.parse({
      ...validProfile,
      hours: [
        {
          labelZh: "周一至周五",
          labelEn: "Monday to Friday",
          valueZh: "11:30–22:00",
          valueEn: "11:30am–10pm"
        }
      ],
      locations: [
        {
          nameZh: "市中心店",
          nameEn: "City branch",
          address: "100 Queen Street, Auckland CBD",
          phone: "+64 9 555 0100",
          mapsUrl: "https://maps.google.com/?q=100+Queen+Street+Auckland"
        },
        {
          nameZh: "中区店",
          address: "500 Dominion Road, Balmoral"
        }
      ],
      bookingUrl: "https://example.com/book",
      socialUrl: "https://example.com/social"
    });

    expect(result.locations).toHaveLength(2);
    expect(result.bookingUrl).toBe("https://example.com/book");
  });

  it("rejects unsafe reservation links", () => {
    const result = restaurantProfileSchema.safeParse({
      ...validProfile,
      bookingUrl: "javascript:alert(1)"
    });

    expect(result.success).toBe(false);
  });

  it("does not expose an ordering URL in restaurant profiles", () => {
    const result = restaurantProfileSchema.parse({
      ...validProfile,
      orderUrl: "https://example.com/order"
    });

    expect("orderUrl" in result).toBe(false);
  });
});

describe("contactConfigSchema", () => {
  it("accepts portfolio contact details without commercial pricing", () => {
    const config = contactConfigSchema.parse({
      email: "wangruiqiao7@gmail.com"
    });

    expect(config.email).toBe("wangruiqiao7@gmail.com");
    expect(config).not.toHaveProperty("priceNzd");
  });
});
