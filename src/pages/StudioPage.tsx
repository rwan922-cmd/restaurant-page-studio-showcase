import { useMemo, useState } from "react";
import { restaurants } from "../data/restaurants";
import {
  restaurantProfileSchema,
  type RestaurantProfile
} from "../domain/restaurant";
import { PreviewPage } from "./PreviewPage";

type StudioFields = Omit<
  RestaurantProfile,
  "menuSections" | "hours" | "locations" | "heroImages" | "galleryImages"
> & {
  menuSectionsJson: string;
  hoursJson: string;
  locationsJson: string;
  heroImagesJson: string;
  galleryImagesJson: string;
};

const starter = restaurants["shu-xiang"];
const {
  menuSections: starterMenuSections,
  hours: starterHours,
  locations: starterLocations,
  heroImages: starterHeroImages,
  galleryImages: starterGalleryImages,
  ...starterFields
} = starter;

const initialFields: StudioFields = {
  ...starterFields,
  menuSectionsJson: JSON.stringify(starterMenuSections, null, 2),
  hoursJson: JSON.stringify(starterHours ?? [], null, 2),
  locationsJson: JSON.stringify(starterLocations ?? [], null, 2),
  heroImagesJson: JSON.stringify(starterHeroImages, null, 2),
  galleryImagesJson: JSON.stringify(starterGalleryImages, null, 2)
};

function optionalValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function StudioPage() {
  const [fields, setFields] = useState(initialFields);

  const validation = useMemo(() => {
    let menuSections: unknown;
    let hours: unknown;
    let locations: unknown;
    let heroImages: unknown;
    let galleryImages: unknown;

    try {
      menuSections = JSON.parse(fields.menuSectionsJson);
      hours = JSON.parse(fields.hoursJson);
      locations = JSON.parse(fields.locationsJson);
      heroImages = JSON.parse(fields.heroImagesJson);
      galleryImages = JSON.parse(fields.galleryImagesJson);
    } catch {
      return {
        success: false as const,
        messages: ["菜单、图片、营业时间或门店 JSON 格式无效"]
      };
    }

    const result = restaurantProfileSchema.safeParse({
      ...fields,
      address: optionalValue(fields.address),
      phone: optionalValue(fields.phone),
      mapsUrl: optionalValue(fields.mapsUrl),
      menuUrl: optionalValue(fields.menuUrl),
      bookingUrl: optionalValue(fields.bookingUrl),
      socialUrl: optionalValue(fields.socialUrl),
      aboutZh: optionalValue(fields.aboutZh),
      aboutEn: optionalValue(fields.aboutEn),
      menuSections,
      hours: Array.isArray(hours) && hours.length > 0 ? hours : undefined,
      locations:
        Array.isArray(locations) && locations.length > 0
          ? locations
          : undefined,
      heroImages,
      galleryImages,
      menuSectionsJson: undefined,
      hoursJson: undefined,
      locationsJson: undefined,
      heroImagesJson: undefined,
      galleryImagesJson: undefined
    });

    if (!result.success) {
      return {
        success: false as const,
        messages: result.error.issues.map(
          (issue) => `${issue.path.join(".") || "profile"}: ${issue.message}`
        )
      };
    }

    return {
      success: true as const,
      profile: result.data,
      json: JSON.stringify(result.data, null, 2)
    };
  }, [fields]);

  function updateField<Key extends keyof StudioFields>(
    key: Key,
    value: StudioFields[Key]
  ) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function downloadJson() {
    if (!validation.success) {
      return;
    }

    const blob = new Blob([validation.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${validation.profile.slug}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main id="main-content" className="studio-page">
      <header className="studio-header">
        <p className="section-label">DEVELOPMENT TOOL</p>
        <h1>餐馆预览生成器</h1>
        <p>此页面只在开发环境开放。修改字段后可实时预览并导出 JSON。</p>
      </header>

      <div className="studio-layout">
        <section className="studio-form" aria-label="餐馆资料">
          <label>
            预览 slug
            <input
              value={fields.slug}
              onChange={(event) => updateField("slug", event.target.value)}
            />
          </label>
          <label>
            中文店名
            <input
              value={fields.nameZh}
              onChange={(event) => updateField("nameZh", event.target.value)}
            />
          </label>
          <label>
            英文店名
            <input
              value={fields.nameEn}
              onChange={(event) => updateField("nameEn", event.target.value)}
            />
          </label>
          <label>
            中文简介
            <input
              value={fields.taglineZh}
              onChange={(event) => updateField("taglineZh", event.target.value)}
            />
          </label>
          <label>
            英文简介
            <input
              value={fields.taglineEn}
              onChange={(event) => updateField("taglineEn", event.target.value)}
            />
          </label>
          <label>
            城市
            <input
              value={fields.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </label>
          <label>
            地址
            <input
              value={fields.address ?? ""}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </label>
          <label>
            中文营业状态
            <input
              value={fields.openingStatusZh}
              onChange={(event) =>
                updateField("openingStatusZh", event.target.value)
              }
            />
          </label>
          <label>
            英文营业状态
            <input
              value={fields.openingStatusEn}
              onChange={(event) =>
                updateField("openingStatusEn", event.target.value)
              }
            />
          </label>
          <label>
            电话
            <input
              value={fields.phone ?? ""}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>
          <label>
            Google Maps 链接
            <input
              value={fields.mapsUrl ?? ""}
              onChange={(event) => updateField("mapsUrl", event.target.value)}
            />
          </label>
          <label>
            菜单链接
            <input
              value={fields.menuUrl ?? ""}
              onChange={(event) => updateField("menuUrl", event.target.value)}
            />
          </label>
          <label>
            在线订位链接
            <input
              value={fields.bookingUrl ?? ""}
              onChange={(event) => updateField("bookingUrl", event.target.value)}
            />
          </label>
          <label>
            社交媒体链接
            <input
              value={fields.socialUrl ?? ""}
              onChange={(event) => updateField("socialUrl", event.target.value)}
            />
          </label>
          <label>
            配色
            <select
              value={fields.theme}
              onChange={(event) =>
                updateField(
                  "theme",
                  event.target.value as RestaurantProfile["theme"]
                )
              }
            >
              <option value="ember">暖红 Ember</option>
              <option value="jade">墨绿 Jade</option>
              <option value="ink">深色 Ink</option>
            </select>
          </label>
          <label>
            菜单资料状态
            <select
              value={fields.menuStatus}
              onChange={(event) =>
                updateField(
                  "menuStatus",
                  event.target.value as RestaurantProfile["menuStatus"]
                )
              }
            >
              <option value="concept-selection">概念精选</option>
              <option value="merchant-confirmed">商家已确认</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={fields.reservationEnabled}
              onChange={(event) =>
                updateField("reservationEnabled", event.target.checked)
              }
            />
            启用站内在线订位
          </label>
          <label className="studio-form__wide">
            中文品牌介绍
            <textarea
              rows={4}
              value={fields.aboutZh ?? ""}
              onChange={(event) => updateField("aboutZh", event.target.value)}
            />
          </label>
          <label className="studio-form__wide">
            英文品牌介绍
            <textarea
              rows={4}
              value={fields.aboutEn ?? ""}
              onChange={(event) => updateField("aboutEn", event.target.value)}
            />
          </label>
          <label className="studio-form__wide">
            分类菜单 JSON
            <textarea
              rows={12}
              value={fields.menuSectionsJson}
              onChange={(event) =>
                updateField("menuSectionsJson", event.target.value)
              }
            />
          </label>
          <label className="studio-form__wide">
            首屏图片 JSON
            <textarea
              rows={12}
              value={fields.heroImagesJson}
              onChange={(event) =>
                updateField("heroImagesJson", event.target.value)
              }
            />
          </label>
          <label className="studio-form__wide">
            精选照片 JSON
            <textarea
              rows={16}
              value={fields.galleryImagesJson}
              onChange={(event) =>
                updateField("galleryImagesJson", event.target.value)
              }
            />
          </label>
          <label className="studio-form__wide">
            营业时间 JSON
            <textarea
              rows={8}
              value={fields.hoursJson}
              onChange={(event) => updateField("hoursJson", event.target.value)}
            />
          </label>
          <label className="studio-form__wide">
            门店 JSON
            <textarea
              rows={10}
              value={fields.locationsJson}
              onChange={(event) =>
                updateField("locationsJson", event.target.value)
              }
            />
          </label>

          {!validation.success && (
            <div className="validation-errors" role="alert">
              {validation.messages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <label className="studio-form__wide">
            导出 JSON
            <textarea
              aria-label="导出 JSON"
              readOnly
              rows={14}
              value={validation.success ? validation.json : ""}
            />
          </label>
          <button
            className="button button--primary"
            type="button"
            disabled={!validation.success}
            onClick={downloadJson}
          >
            下载 JSON
          </button>
        </section>

        <section className="studio-preview" aria-label="实时预览">
          {validation.success ? (
            <PreviewPage profile={validation.profile} />
          ) : (
            <div className="preview-placeholder">
              修正表单错误后，这里会显示实时预览。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
