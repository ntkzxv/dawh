/**
 * Official DAWH Brand & Logo Local Assets (from /assets)
 */

export const DAWH_LOGOS = {
  // 1:1 Square (1024x1024)
  square1024: {
    black: "/assets/dawh_black1024logo.png",
    light: "/assets/dawh_light1024logo.png",
  },
  // 1:1 Square (2048x2048)
  square2048: {
    black: "/assets/dawh_2048black_logo.png",
    light: "/assets/dawh_2048light_logo.png",
  },
  // Default Square (1:1)
  square: {
    black: "/assets/dawh_black1024logo.png",
    light: "/assets/dawh_2048light_logo.png",
  },
  // 2:1 Horizontal (2048x1024)
  horizontal: {
    black: "/assets/dawh_2048x1024black_logo.png",
    light: "/assets/dawh_2048x1024light_logo.png",
  },
  // 4:1 Spec Wide Ratio (4x1024 / 4x1025)
  spec4x1024: {
    black: "/assets/dawh_black4x1024speclogo.png",
    light: "/assets/dawh_light4x1025speclogo.png",
  },
  // 4:1 Extra High-Res (4x2048)
  spec4x2048: {
    black: "/assets/dawh_black4x2048logo.png",
    light: "/assets/dawh_light2048logo.png",
  },
  // Long No-Space / Zero-Padding Edge-to-Edge Logo
  longNoSpace: "/assets/dawh_longnospace_logo.png",
};

export function getDawhLogo(
  theme: "light" | "dark" = "dark",
  ratio: "horizontal" | "square" | "square1024" | "square2048" | "spec4x1024" | "longNoSpace" = "horizontal"
) {
  if (ratio === "longNoSpace") {
    return DAWH_LOGOS.longNoSpace;
  }
  const isLight = theme === "light";
  return isLight ? DAWH_LOGOS[ratio].black : DAWH_LOGOS[ratio].light;
}
