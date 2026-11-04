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
    cardsHover: "#383838",
    inputBg: "#222222",

    // Accents & Actions
    accent: "#FFFFFF",
    accentForeground: "#222222",
    buttonBg: "#383838",
    buttonBorder: "#E4E4E7",
    buttonText: "#F4F4F5",
    buttonHoverBg: "#FFFFFF",
    buttonHoverText: "#222222",
    buttonHoverBorder: "#FFFFFF",

    // Borders & Separators
    border: "#444444",
    borderSubtle: "#444444",
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
      danger: "#E71D36",
      info: "#FFFFFF",
    },
  },

  light: {
    // Surfaces & Backgrounds
    canvas: "#F8FAFC",
    sidebar: "#FFFFFF",
    cards: "#FFFFFF",
    cardsHover: "#F1F5F9",
    inputBg: "#F8FAFC",

    // Accents & Actions
    accent: "#222222",
    accentForeground: "#FFFFFF",
    buttonBg: "#FFFFFF",
    buttonBorder: "#737D88",
    buttonText: "#222222",
    buttonHoverBg: "#222222",
    buttonHoverText: "#FFFFFF",
    buttonHoverBorder: "#737D88",

    // Borders & Separators
    border: "#E4E4E7",
    borderSubtle: "#F1F5F9",
    borderFocus: "#737D88",

    // Text Hierarchy
    text: {
      primary: "#222222",    // Dark Slate 900
      secondary: "#383838",  // Supporting text
      muted: "#383838",      // Slate 700
      contrast: "#FFFFFF",
    },

    // Status Indicators
    status: {
      success: "#15A465",
      warning: "#CE8D10",
      danger: "#C7291F",
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
