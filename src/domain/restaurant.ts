import { z } from "zod";

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
    message: "链接必须使用 http 或 https"
  });

const localImagePathSchema = z
  .string()
  .trim()
  .regex(
    /^\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/,
    "图片必须使用站内绝对路径和有效图片扩展名"
  );

export const imageAssetSchema = z.object({
  desktopSrc: localImagePathSchema,
  mobileSrc: localImagePathSchema,
  altZh: z.string().trim().min(1, "图片中文替代文本不能为空"),
  altEn: z.string().trim().min(1, "图片英文替代文本不能为空"),
  captionZh: z.string().trim().min(1, "图片中文说明不能为空"),
  captionEn: z.string().trim().min(1, "图片英文说明不能为空"),
  sourceType: z.enum(["concept", "merchant"])
});

export const dishSchema = z.object({
  nameZh: z.string().trim().min(1, "菜品中文名不能为空"),
  nameEn: z.string().trim().min(1, "菜品英文名不能为空"),
  descriptionZh: z.string().trim().min(1, "菜品中文介绍不能为空"),
  descriptionEn: z.string().trim().min(1, "菜品英文介绍不能为空"),
  image: imageAssetSchema,
  price: z.number().positive("菜品价格必须大于 0").optional()
});

const menuSectionSchema = z.object({
  titleZh: z.string().trim().min(1, "菜单分类中文名不能为空"),
  titleEn: z.string().trim().min(1).optional(),
  dishes: z.array(dishSchema).min(1, "菜单分类至少需要一道菜").max(16)
});

const hoursSchema = z.object({
  labelZh: z.string().trim().min(1),
  labelEn: z.string().trim().min(1).optional(),
  valueZh: z.string().trim().min(1),
  valueEn: z.string().trim().min(1).optional()
});

const locationSchema = z.object({
  nameZh: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1, "门店地址不能为空"),
  phone: z.string().trim().min(1).optional(),
  mapsUrl: httpUrlSchema.optional()
});

export const restaurantProfileSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug 只能包含小写字母、数字和连字符"),
  nameZh: z.string().trim().min(1, "中文店名不能为空"),
  nameEn: z.string().trim().min(1, "英文店名不能为空"),
  taglineZh: z.string().trim().min(1, "中文简介不能为空"),
  taglineEn: z.string().trim().min(1, "英文简介不能为空"),
  city: z.string().trim().min(1, "城市不能为空"),
  address: z.string().trim().min(1).optional(),
  openingStatusZh: z.string().trim().min(1, "中文营业状态不能为空"),
  openingStatusEn: z.string().trim().min(1, "英文营业状态不能为空"),
  phone: z.string().trim().min(1).optional(),
  mapsUrl: httpUrlSchema.optional(),
  menuUrl: httpUrlSchema.optional(),
  bookingUrl: httpUrlSchema.optional(),
  socialUrl: httpUrlSchema.optional(),
  aboutZh: z.string().trim().min(1).optional(),
  aboutEn: z.string().trim().min(1).optional(),
  menuStatus: z.enum(["concept-selection", "merchant-confirmed"]),
  reservationEnabled: z.boolean().default(false),
  heroImages: z.array(imageAssetSchema).length(3, "首屏必须配置 3 张图片"),
  galleryImages: z.array(imageAssetSchema).length(6, "精选照片区必须配置 6 张图片"),
  menuSections: z.array(menuSectionSchema).min(1).max(8),
  hours: z.array(hoursSchema).min(1).max(14).optional(),
  locations: z.array(locationSchema).min(1).max(8).optional(),
  theme: z.enum(["ember", "jade", "ink"])
});

export const contactConfigSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱")
});

export type Dish = z.infer<typeof dishSchema>;
export type ImageAsset = z.infer<typeof imageAssetSchema>;
export type RestaurantProfile = z.infer<typeof restaurantProfileSchema>;
export type ContactConfig = z.infer<typeof contactConfigSchema>;

export function validateRestaurantProfile(input: unknown) {
  return restaurantProfileSchema.safeParse(input);
}
