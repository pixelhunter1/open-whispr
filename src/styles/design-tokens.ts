/**
 * Design Tokens - OpenWhispr Turquoise Design System
 * Central source of truth for design values
 */

export const designTokens = {
  colors: {
    // Turquoise/Teal Primary Colors
    primary: {
      50: "#ecf9f5",
      100: "#d9f2ec",
      200: "#b3e6d9",
      300: "#8cd9c6",
      400: "#66ccb3",
      500: "#32cda6", // Main turquoise
      600: "#28a485",
      700: "#1e7b64",
      800: "#145243",
      900: "#0f2421", // Very dark teal (text)
      950: "#0a1814",
      DEFAULT: "#32cda6",
    },
    // Secondary/Text colors (teal tones)
    secondary: {
      50: "#f0f9f7",
      100: "#d9f2ec",
      200: "#b3e6d9",
      300: "#8cd9c6",
      400: "#5bb5a0",
      500: "#3a9283", // Medium teal (description text)
      600: "#2e7569",
      700: "#22584f",
      800: "#173b35",
      900: "#0f2421", // Dark teal
      950: "#0a1814",
      DEFAULT: "#3a9283",
    },
    // Background colors
    background: {
      50: "#ffffff",
      100: "#fafafa",
      200: "#f5f5f5",
      300: "#ecf9f5", // Very light turquoise
      400: "#d9f2ec",
      500: "#b3e6d9",
      600: "#8cd9c6",
      700: "#66ccb3",
      800: "#0f2421",
      900: "#0a1814",
      950: "#050c0a",
      DEFAULT: "#ffffff",
    },
    // Text colors
    text: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#3a9283", // Medium teal
      800: "#0f2421", // Dark teal
      900: "#0a1814", // Very dark teal
      950: "#050c0a",
      DEFAULT: "#0f2421",
    },
    // Status colors
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#34C759", // Apple green
      600: "#30B84D",
      700: "#2AA644",
      800: "#166534",
      900: "#14532d",
      950: "#052e16",
      DEFAULT: "#34C759",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ff3b30", // Apple red
      600: "#e62e24",
      700: "#d32119",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
      DEFAULT: "#ff3b30",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#FF9500", // Apple orange
      600: "#E68A00",
      700: "#CC7A00",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03",
      DEFAULT: "#FF9500",
    },
    // Border colors (using turquoise tints)
    border: {
      light: "#b3e6d9",
      DEFAULT: "#8cd9c6",
      dark: "#66ccb3",
    },
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
    base: ["1rem", { lineHeight: "1.5rem" }], // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export type DesignTokens = typeof designTokens;
