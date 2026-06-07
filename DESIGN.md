# Design System

## Direction

City-night dining presented as an engineering case study. Near-black surfaces
create the evening setting, food imagery preserves the product's subject,
oxblood drives primary actions, and jade provides a quieter technical signal.

## Color

- Canvas: `oklch(0.14 0.012 25)`
- Raised canvas: `oklch(0.19 0.016 25)`
- Light canvas: `oklch(0.97 0.002 25)`
- Primary ink: `oklch(0.96 0.006 25)`
- Dark ink: `oklch(0.18 0.012 25)`
- Muted light ink: `oklch(0.76 0.012 25)`
- Muted dark ink: `oklch(0.43 0.012 25)`
- Oxblood action: `oklch(0.56 0.18 28)`
- Oxblood hover: `oklch(0.49 0.17 28)`
- Jade accent: `oklch(0.53 0.095 160)`
- Hairline light: `oklch(1 0 0 / 0.16)`
- Hairline dark: `oklch(0.18 0.012 25 / 0.18)`

Use the committed strategy on the portfolio homepage and restrained
restaurant themes elsewhere. Do not use decorative gradients or gradient
text.

## Typography

- Display Latin and numbers: self-hosted Barlow Condensed, weights 600 to 800.
- Chinese and body copy: `PingFang SC`, `Microsoft YaHei`, `Noto Sans CJK SC`,
  system sans-serif.
- Body text starts at 16px. Supporting text never drops below 14px on mobile.
- Display headings use fluid sizing, balanced wrapping and letter spacing no
  tighter than `-0.035em`.
- Uppercase labels are rare, short and at least 14px.

## Layout

- Content widths: 1180px for image-led areas, 960px for reading areas.
- Spacing follows a 4, 8, 12, 16, 24, 32, 48, 72 and 96px rhythm.
- Homepage hero uses an asymmetric text and image split.
- Restaurant heroes remain full bleed. Menu and information areas use open
  rows and rules instead of repeated floating cards.
- Border radii stay between 6 and 16px except true pill controls.

## Components

- Buttons are rectangular with 8px corners and a minimum 48px height.
- Focus rings use a high-contrast jade and remain visible on dark and light
  surfaces.
- Quick actions are one horizontal row on desktop and horizontally scrollable
  on mobile.
- Images reserve aspect ratio, use WebP sources and provide a bilingual
  fallback.
- Contact areas prioritise email and GitHub. Private messaging QR codes are
  intentionally kept out of the public showcase repository.
- Language controls use a compact `EN / 中文` text button with an explicit
  accessible label and at least a 44px target.

## Motion

- The restaurant hero crossfades and slowly scales three images using only
  opacity and transform.
- Reduced motion shows the first hero image without animation.
- Interaction transitions last 160 to 240ms and use an ease-out curve.
- No blanket scroll reveal animations.
