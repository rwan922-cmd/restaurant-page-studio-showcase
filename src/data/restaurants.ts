import {
  restaurantProfileSchema,
  type ImageAsset,
  type RestaurantProfile
} from "../domain/restaurant";

function mapsSearch(query: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

function conceptAsset(
  index: number,
  subjectZh: string,
  subjectEn: string
): ImageAsset {
  return {
    desktopSrc: `/media/shu-xiang/scene-${index}.webp`,
    mobileSrc: `/media/shu-xiang/scene-${index}-mobile.webp`,
    altZh: `${subjectZh}概念画面`,
    altEn: `Concept image of ${subjectEn}`,
    captionZh: "概念画面，非商家实拍",
    captionEn: "Concept image, not a merchant photograph",
    sourceType: "concept"
  };
}

const galleryImages = [
  conceptAsset(1, "川味分享餐桌", "Sichuan-inspired sharing table"),
  conceptAsset(2, "香辣热菜", "spicy hot dish"),
  conceptAsset(3, "手作面食", "handmade noodles"),
  conceptAsset(4, "小吃与冷菜", "snacks and chilled dishes"),
  conceptAsset(5, "多人聚餐", "group dining"),
  conceptAsset(6, "夜间餐厅氛围", "evening restaurant atmosphere")
] satisfies ImageAsset[];

const shuXiang = restaurantProfileSchema.parse({
  slug: "shu-xiang",
  nameZh: "蜀香小馆",
  nameEn: "Shu Xiang",
  taglineZh: "匿名餐厅概念案例",
  taglineEn: "Anonymous restaurant concept",
  city: "Auckland",
  address: "Auckland, New Zealand",
  openingStatusZh: "概念案例，资料待确认",
  openingStatusEn: "Concept demo, details to confirm",
  reservationEnabled: true,
  phone: "+64 9 555 0123",
  mapsUrl: mapsSearch("Auckland New Zealand"),
  theme: "ember",
  aboutZh:
    "这是一个不对应真实商家的匿名案例，用来展示双语品牌介绍、图文菜单、订位请求和商家确认流程如何组合成一个完整餐厅网站。",
  aboutEn:
    "This anonymous concept does not represent a real merchant. It demonstrates how a bilingual story, visual menu, reservation request and merchant confirmation workflow can fit into one restaurant website.",
  menuStatus: "concept-selection",
  heroImages: galleryImages.slice(0, 3),
  galleryImages,
  hours: [
    {
      labelZh: "营业时间",
      labelEn: "Opening hours",
      valueZh: "演示资料，请向真实商家确认",
      valueEn: "Demo content; confirm with the real restaurant"
    }
  ],
  locations: [
    {
      nameZh: "匿名演示门店",
      nameEn: "Anonymous demo location",
      address: "Auckland, New Zealand",
      phone: "+64 9 555 0123",
      mapsUrl: mapsSearch("Auckland New Zealand")
    }
  ],
  menuSections: [
    {
      titleZh: "招牌推荐",
      titleEn: "Highlights",
      dishes: [
        {
          nameZh: "香辣牛肉汤",
          nameEn: "Spicy beef soup",
          descriptionZh: "以牛肉、香辣汤底和蔬菜搭配的概念热汤，具体配方由商家确认。",
          descriptionEn:
            "A concept hot soup with beef, chilli-led broth and vegetables; final ingredients would be confirmed by the merchant.",
          image: galleryImages[1],
          price: 18
        },
        {
          nameZh: "手工担担面",
          nameEn: "Handmade dan dan noodles",
          descriptionZh: "带有芝麻、辣香和手作面条口感的概念面食。",
          descriptionEn:
            "A concept noodle dish with sesame, chilli aroma and a handmade noodle texture.",
          image: galleryImages[2],
          price: 16
        },
        {
          nameZh: "多人分享套餐",
          nameEn: "Group sharing set",
          descriptionZh: "为朋友聚餐设计的概念组合，最终菜品、人数和价格由商家确认。",
          descriptionEn:
            "A concept set for group dining; dishes, party size and price would be confirmed by the merchant.",
          image: galleryImages[4]
        }
      ]
    },
    {
      titleZh: "小吃与冷菜",
      titleEn: "Snacks and chilled dishes",
      dishes: [
        {
          nameZh: "双椒皮蛋",
          nameEn: "Preserved egg with two peppers",
          descriptionZh: "以皮蛋和双椒风味组合的概念冷菜，适合餐前分享。",
          descriptionEn:
            "A concept chilled dish pairing preserved egg with two-pepper flavour for sharing.",
          image: galleryImages[3],
          price: 12
        },
        {
          nameZh: "当日甜品",
          nameEn: "Dessert of the day",
          descriptionZh: "根据当日备餐变化的概念甜品，供应内容由商家确认。",
          descriptionEn:
            "A concept dessert that changes with daily preparation and merchant confirmation.",
          image: galleryImages[5]
        }
      ]
    }
  ]
});

export const restaurants: Record<string, RestaurantProfile> = {
  [shuXiang.slug]: shuXiang
};
