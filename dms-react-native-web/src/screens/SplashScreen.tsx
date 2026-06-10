import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { bento } from "../theme";

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoMark}>
          <Image
            source={require("../../assets/favicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.brand}>
          <Text style={styles.appName}>DMS Seller</Text>
          <Text style={styles.subtitle}>Đang khởi động ứng dụng</Text>
        </View>

        <View style={styles.loadingRow}>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={styles.loadingText}>Vui lòng chờ...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: bento.primary,
    flex: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 28,
    width: "100%",
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 16,
    borderWidth: 1,
    height: 84,
    justifyContent: "center",
    overflow: "hidden",
    width: 84,
  },
  logoImage: {
    borderRadius: 14,
    height: 70,
    width: 70,
  },
  brand: {
    alignItems: "center",
    gap: 6,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    minHeight: 42,
    paddingHorizontal: 16,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
