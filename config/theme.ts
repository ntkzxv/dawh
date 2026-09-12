/**
 * ============================================================================
 * DAWH OFFICIAL MASTER DESIGN SYSTEM & THEME TOKENS
 * ============================================================================
 * Central single source of truth for all colors, surfaces, typography,
 * borders, text hierarchies, and UI tokens across the DAWH Ecosystem.
 */

export type ThemeMode = "dark" | "light";

export interface ColorTokens {
  // Surfaces & Backgrounds
  canvas: string;
  sidebar: string;
  cards: string;
  cardsHover: string;
  inputBg: string;

  // Accents & Actions
  accent: string;
  accentForeground: string;
  buttonBg: string;
  buttonBorder: string;
  buttonText: string;
  buttonHoverBg: string;
  buttonHoverText: string;
  buttonHoverBorder: string;

  // Borders & Separators
  border: string;
  borderSubtle: string;
  borderFocus: string;

  // Text Hierarchy
  text: {
    primary: string;   // Level 1: Major Headings (h1, h2), Brand titles, Active labels
    secondary: string; // Level 2: Body text, Input labels, Form text
    muted: string;     // Level 3: Subtitles, Footers, Metadata, Hints
    contrast: string;  // Inverted text for high-contrast badges/buttons
  };

  // Status Indicators
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
}

export const customTheme: Record<ThemeMode, ColorTokens> = {
  dark: {
    // Surfaces & Backgrounds
    canvas: "#2C2C2C",
    sidebar: "#222222",
    cards: "#383838",
    cardsHover: "#404040",
    inputBg: "#202020",

    // Accents & Actions
    accent: "#FFFFFF",
    accentForeground: "#000000",
    buttonBg: "#282828",
    buttonBorder: "#444444",
    buttonText: "#FFFFFF",
    buttonHoverBg: "#FFFFFF",
    buttonHoverText: "#000000",
    buttonHoverBorder: "#FFFFFF",

    // Borders & Separators
    border: "#444444",
    borderSubtle: "#333333",
    borderFocus: "rgba(255, 255, 255, 0.6)",

    // Text Hierarchy
    text: {
      primary: "#FFFFFF",    // Pure White
      secondary: "#F4F4F5",  // Soft White
      muted: "#E4E4E7",      // Muted Zinc
      contrast: "#000000",
    },

    // Status Indicators
    status: {
      success: "#2EC4B6",
      warning: "#FF9F1C",
      danger: "#EF4444",
      info: "#FFFFFF",
    },
  },

  light: {
    // Surfaces & Backgrounds
    canvas: "#F8FAFC",
    sidebar: "#FFFFFF",
    cards: "#FFFFFF",
    cardsHover: "#F8FAFC",
    inputBg: "#F8FAFC",

    // Accents & Actions
    accent: "#222222",
    accentForeground: "#FFFFFF",
    buttonBg: "#F1F5F9",
    buttonBorder: "#E4E4E7",
    buttonText: "#222222",
    buttonHoverBg: "#222222",
    buttonHoverText: "#FFFFFF",
    buttonHoverBorder: "#222222",

    // Borders & Separators
    border: "#E4E4E7",
    borderSubtle: "#F1F5F9",
    borderFocus: "#222222",

    // Text Hierarchy
    text: {
      primary: "#222222",    // Dark Slate 900
      secondary: "#2C2C2C",  // Slate 800
      muted: "#383838",      // Slate 700
      contrast: "#FFFFFF",
    },

    // Status Indicators
    status: {
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      info: "#222222",
    },
  },
};

/**
 * Helper to fetch complete theme tokens for any mode
 */
export function getThemeTokens(mode: ThemeMode = "dark"): ColorTokens {
  return customTheme[mode] || customTheme.dark;
}
