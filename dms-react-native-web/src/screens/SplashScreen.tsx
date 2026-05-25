import { StyleSheet, Text, View } from "react-native";

import { bento } from "../theme";

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <View style={styles.logoScene}>
          <View pointerEvents="none" style={styles.outerGlow} />
          <View pointerEvents="none" style={styles.coreGlow} />
          <View pointerEvents="none" style={styles.arcTop} />
          <View pointerEvents="none" style={styles.arcBottom} />
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>D</Text>
          </View>
        </View>

        <Text style={styles.appName}>DMS SELLER</Text>
        <Text style={styles.tagline}>Quản lý bán hàng{"\n"}hiệu quả mọi lúc, mọi nơi</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: "#07172B",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  center: {
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 32,
  },
  logoScene: {
    alignItems: "center",
    height: 156,
    justifyContent: "center",
    marginBottom: 9,
    position: "relative",
    width: 156,
  },
  outerGlow: {
    backgroundColor: "rgba(74,222,222,0.08)",
    borderRadius: 76,
    height: 152,
    position: "absolute",
    shadowColor: bento.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 30,
    width: 152,
  },
  coreGlow: {
    backgroundColor: "rgba(80,134,255,0.12)",
    borderRadius: 56,
    height: 112,
    position: "absolute",
    shadowColor: bento.route,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    width: 112,
  },
  arcTop: {
    borderBottomColor: "rgba(74,222,222,0.18)",
    borderColor: bento.primary,
    borderLeftColor: "transparent",
    borderRadius: 59,
    borderWidth: 2,
    height: 118,
    opacity: 0.92,
    position: "absolute",
    transform: [{ rotate: "-36deg" }],
    width: 118,
  },
  arcBottom: {
    borderBottomColor: bento.primary,
    borderColor: "rgba(74,222,222,0.14)",
    borderRadius: 49,
    borderRightColor: bento.primary,
    borderWidth: 2,
    height: 98,
    opacity: 0.72,
    position: "absolute",
    transform: [{ rotate: "28deg" }],
    width: 98,
  },
  logoMark: {
    alignItems: "center",
    height: 64,
    justifyContent: "center",
    width: 96,
  },
  logoLetter: {
    color: "#FFFFFF",
    fontSize: 58,
    fontWeight: "900",
    lineHeight: 62,
    textShadowColor: "rgba(255,255,255,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  tagline: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  bottom: {
    alignItems: "center",
    bottom: 36,
    left: 0,
    position: "absolute",
    right: 0,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    height: 3,
    overflow: "hidden",
    width: 54,
  },
  progressFill: {
    backgroundColor: bento.primary,
    borderRadius: 999,
    height: "100%",
    width: "48%",
  },
});

