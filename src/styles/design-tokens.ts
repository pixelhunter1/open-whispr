/**
 * Design Tokens - OpenWhispr
 * Central source of truth for design values
 */

export const designTokens = {
  colors: {
    text: {
      50: "var(--text-50)",
      100: "var(--text-100)",
      200: "var(--text-200)",
      300: "var(--text-300)",
      400: "var(--text-400)",
      500: "var(--text-500)",
      600: "var(--text-600)",
      700: "var(--text-700)",
      800: "var(--text-800)",
      900: "var(--text-900)",
      950: "var(--text-950)",
      DEFAULT: "var(--text-900)",
    },
    background: {
      50: "var(--background-50)",
      100: "var(--background-100)",
      200: "var(--background-200)",
      300: "var(--background-300)",
      400: "var(--background-400)",
      500: "var(--background-500)",
      600: "var(--background-600)",
      700: "var(--background-700)",
      800: "var(--background-800)",
      900: "var(--background-900)",
      950: "var(--background-950)",
      DEFAULT: "var(--background-50)",
    },
    primary: {
      50: "var(--primary-50)",
      100: "var(--primary-100)",
      200: "var(--primary-200)",
      300: "var(--primary-300)",
      400: "var(--primary-400)",
      500: "var(--primary-500)",
      600: "var(--primary-600)",
      700: "var(--primary-700)",
      800: "var(--primary-800)",
      900: "var(--primary-900)",
      950: "var(--primary-950)",
      DEFAULT: "var(--primary-500)",
    },
    secondary: {
      50: "var(--secondary-50)",
      100: "var(--secondary-100)",
      200: "var(--secondary-200)",
      300: "var(--secondary-300)",
      400: "var(--secondary-400)",
      500: "var(--secondary-500)",
      600: "var(--secondary-600)",
      700: "var(--secondary-700)",
      800: "var(--secondary-800)",
      900: "var(--secondary-900)",
      950: "var(--secondary-950)",
      DEFAULT: "var(--secondary-500)",
    },
    accent: {
      50: "var(--accent-50)",
      100: "var(--accent-100)",
      200: "var(--accent-200)",
      300: "var(--accent-300)",
      400: "var(--accent-400)",
      500: "var(--accent-500)",
      600: "var(--accent-600)",
      700: "var(--accent-700)",
      800: "var(--accent-800)",
      900: "var(--accent-900)",
      950: "var(--accent-950)",
      DEFAULT: "var(--accent-500)",
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
