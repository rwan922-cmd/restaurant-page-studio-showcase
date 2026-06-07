import { useState } from "react";
import type { ImageAsset } from "../domain/restaurant";

type FoodImageProps = {
  asset: ImageAsset;
  className?: string;
  priority?: boolean;
  testId?: string;
};

export function FoodImage({
  asset,
  className = "",
  priority = false,
  testId
}: FoodImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`food-image ${failed ? "food-image--failed" : ""} ${className}`.trim()}
      data-testid={testId}
    >
      {failed ? (
        <div className="food-image__fallback" role="img" aria-label={asset.altZh}>
          <span>图片暂不可用</span>
          <small>Image temporarily unavailable</small>
        </div>
      ) : (
        <picture>
          <source media="(max-width: 640px)" srcSet={asset.mobileSrc} />
          <img
            src={asset.desktopSrc}
            alt={`${asset.altZh} / ${asset.altEn}`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </div>
  );
}
