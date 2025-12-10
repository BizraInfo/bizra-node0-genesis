export const brandTokens = {
  color: {
    primary: "#0C8CE9",
    primaryDark: "#066BB3",
    secondary: "#10B981",
    accent: "#F59E0B",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#22C55E",
    info: "#3B82F6",
    bg: "#0F172A",
    bgElevated: "#111827",
    surface: "#0B1222",
    card: "#101828",
    border: "#1F2937",
    text: "#E5E7EB",
    textMuted: "#9CA3AF",
  },
  font: {
    familySans: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    familyMono:
      "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    sizeBase: "14px",
    sizeSm: "12px",
    sizeLg: "16px",
    weightRegular: 400,
    weightMedium: 500,
    weightBold: 700,
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
  },
} as const;

export type BrandTokens = typeof brandTokens;
