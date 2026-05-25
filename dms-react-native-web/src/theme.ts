export const palette = {
  primary: "#155EEF",
  primaryDark: "#0F3EA8",
  primarySoft: "#EAF1FF",
  background: "#EEF2F7",
  surface: "#FFFFFF",
  surfaceSoft: "#F7F9FC",
  surfaceRaised: "#FFFFFF",
  surfaceMuted: "#E8EDF5",
  text: "#111827",
  textPrimary: "#111827",
  textSecondary: "#5B6472",
  textMuted: "#8A94A6",
  muted: "#5B6472",
  subtle: "#8A94A6",
  border: "#DDE3EC",
  borderSoft: "#EEF2F7",
  success: "#078662",
  successSoft: "#E7F7EF",
  warning: "#B7791F",
  warningSoft: "#FFF4D8",
  danger: "#C93434",
  dangerSoft: "#FDECEC",
  accent: "#0E9384",
  accentSoft: "#E7F8F5",
  route: "#5B5BD6",
  routeSoft: "#EEEEFF",
  dark: "#101828",
  darkPanel: "#182230",
  darkHover: "#243247",
  darkMuted: "#D0D5DD",
  ink: "#0B1220",
  glass: "rgba(255,255,255,0.86)",
  overlay: "rgba(16,24,40,0.48)",
  gradientStart: "#155EEF",
  gradientEnd: "#0E9384",
};

export const bento = {
  primary: "#4ADEDE",
  primaryDark: "#0E9EA8",
  primarySoft: "#E7FBFC",
  background: "#F7FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F8FB",
  surfaceRaised: "#FFFFFF",
  text: "#0A1B34",
  textSecondary: "#596579",
  textMuted: "#8E97A6",
  border: "#E8EEF5",
  borderStrong: "#BEEFF2",
  success: "#12A87F",
  successSoft: "#E7F8F2",
  warning: "#E58A23",
  warningSoft: "#FFF4E2",
  danger: "#EF5D5D",
  dangerSoft: "#FFF0F0",
  route: "#5086FF",
  routeSoft: "#EDF4FF",
  info: "#5086FF",
  infoSoft: "#EDF4FF",
  ink: "#0A1B34",
  chrome: "#07172B",
  chromeSoft: "#10233F",
  chromeMuted: "#1A3354",
  glass: "rgba(255,255,255,0.88)",
  shadow: "rgba(10,27,52,0.14)",
};

export const bentoShadow = {
  shadowColor: bento.shadow,
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 3,
};

export const bentoSoftShadow = {
  shadowColor: bento.shadow,
  shadowOpacity: 0.045,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 9 },
  elevation: 1,
};

export const legacyPalette = {
  background: "#eef3f8",
  surface: "#f6f9fc",
  surfaceRaised: "#ffffff",
  surfaceMuted: "#e6edf5",
  text: "#111827",
  muted: "#667085",
  subtle: "#98a2b3",
  border: "#d6dee9",
  borderSoft: "#e8eef5",
  primary: "#0a84ff",
  primaryDark: "#0057d9",
  primarySoft: "#d9ebff",
  accent: "#00a7a7",
  accentSoft: "#d9f7f5",
  route: "#5856d6",
  routeSoft: "#e7e6ff",
  danger: "#c24130",
  dangerSoft: "#ffe3df",
  warning: "#b86e00",
  warningSoft: "#fff0cc",
  success: "#16885f",
  successSoft: "#dff7ec",
  dark: "#090d18",
  darkPanel: "#111827",
  darkHover: "#1d2638",
  darkMuted: "#c8d1df",
  ink: "#0b1220",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screen: 20,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const shadow = {
  shadowColor: "#101828",
  shadowOpacity: 0.1,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 2,
};

export const softShadow = {
  shadowColor: "#101828",
  shadowOpacity: 0.055,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 1,
};

export const hairlineShadow = {
  shadowColor: "#101828",
  shadowOpacity: 0.025,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
};

export const typography = {
  title: {
    fontSize: 23,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 23,
  },
  body: {
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
  },
};
