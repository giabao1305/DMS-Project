import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const palette = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "#EAF2FF",

  background: "#F6F8FC",
  surface: "#FFFFFF",
  surfaceSoft: "#F8FAFD",
  surfaceRaised: "#FFFFFF",
  surfaceMuted: "#EDF2FA",

  text: "#14213D",
  textPrimary: "#14213D",
  textSecondary: "#58677F",
  textMuted: "#8B98AE",

  muted: "#65758B",
  subtle: "#A8B2C4",

  border: "#DDE5F0",
  borderSoft: "#EEF3F9",

  success: "#0284C7",
  successSoft: "#E8F5FD",

  warning: "#D97706",
  warningSoft: "#FFF3DE",

  danger: "#DC2626",
  dangerSoft: "#FEEBEC",

  info: "#2563EB",
  infoSoft: "#EAF2FF",

  route: "#0284C7",
  routeSoft: "#E8F5FD",

  customer: "#2563EB",
  customerSoft: "#EAF2FF",

  order: "#D97706",
  orderSoft: "#FFF3DE",

  revenue: "#2563EB",
  revenueSoft: "#EAF2FF",

  inventory: "#D97706",
  inventorySoft: "#FFF3DE",

  visit: "#0284C7",
  visitSoft: "#E8F5FD",

  map: "#0284C7",
  mapSoft: "#E8F5FD",

  // Dark
  dark: "#10244A",
  darkPanel: "#173363",
  darkHover: "#22447B",
  darkMuted: "#DDE8FB",

  ink: "#10244A",

  glass: "rgba(255,255,255,0.82)",
  overlay: "rgba(16,36,74,0.44)",

  gradientStart: "#2563EB",
  gradientEnd: "#1D4ED8",
};

// New design token name.
// Keep "bento" as alias below so old screens do not break immediately.
export const atlas = {
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primarySoft: palette.primarySoft,

  background: palette.background,

  surface: palette.surface,
  surfaceAlt: palette.surfaceSoft,
  surfaceRaised: palette.surfaceRaised,

  text: palette.text,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,

  border: palette.border,
  borderStrong: "#C7D9FB",

  success: palette.success,
  successSoft: palette.successSoft,

  warning: palette.warning,
  warningSoft: palette.warningSoft,

  danger: palette.danger,
  dangerSoft: palette.dangerSoft,

  route: palette.route,
  routeSoft: palette.routeSoft,

  info: palette.info,
  infoSoft: palette.infoSoft,

  ink: palette.ink,

  chrome: "#FFFFFF",
  chromeSoft: "#F8FAFD",
  chromeMuted: "#EDF2FA",

  glass: palette.glass,
  overlay: palette.overlay,

  shadow: "rgba(20,33,61,0.10)",

  gold: palette.order,
  goldSoft: palette.orderSoft,

  customer: palette.customer,
  customerSoft: palette.customerSoft,
  order: palette.order,
  orderSoft: palette.orderSoft,
  revenue: palette.revenue,
  revenueSoft: palette.revenueSoft,
  inventory: palette.inventory,
  inventorySoft: palette.inventorySoft,
  visit: palette.visit,
  visitSoft: palette.visitSoft,
  map: palette.map,
  mapSoft: palette.mapSoft,
};

export const atlasShadow = {
  shadowColor: atlas.shadow,
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 4,
};

export const atlasSoftShadow = {
  shadowColor: atlas.shadow,
  shadowOpacity: 0.055,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 9 },
  elevation: 2,
};

export const atlasHairlineShadow = {
  shadowColor: atlas.shadow,
  shadowOpacity: 0.035,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};

// Backward-compatible aliases.
export const bento = atlas;
export const bentoShadow = atlasShadow;
export const bentoSoftShadow = atlasSoftShadow;

export const legacyPalette = palette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screen: 16,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 8,
  xxl: 8,
};

export const shadow = atlasShadow;
export const softShadow = atlasSoftShadow;
export const hairlineShadow = atlasHairlineShadow;

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 21,
  },
};

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    primary: atlas.primary,
    onPrimary: "#FFFFFF",
    primaryContainer: atlas.primarySoft,
    onPrimaryContainer: atlas.primaryDark,

    secondary: palette.order,
    secondaryContainer: palette.orderSoft,
    tertiary: atlas.route,

    background: atlas.background,
    surface: atlas.surface,
    surfaceVariant: atlas.surfaceAlt,

    outline: atlas.border,
    outlineVariant: atlas.borderStrong,

    error: atlas.danger,
    onSurface: atlas.text,
    onSurfaceVariant: atlas.textSecondary,
  },
};
