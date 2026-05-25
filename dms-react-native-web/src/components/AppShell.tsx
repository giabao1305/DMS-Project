import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRefresh } from "../hooks/RefreshContext";
import { bento, bentoShadow, bentoSoftShadow } from "../theme";
import type { AuthUser } from "../types/domain";

export type SellerTab =
  | "dashboard"
  | "customers"
  | "routes"
  | "orders"
  | "visits"
  | "kpis"
  | "leaves"
  | "notifications"
  | "profile"
  | "more";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const primaryTabs: Array<{ id: SellerTab; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Trang chủ", icon: "home" },
  { id: "customers", label: "Khách", icon: "storefront-outline" },
  { id: "visits", label: "Ghé", icon: "map-marker-check-outline" },
  { id: "orders", label: "Đơn", icon: "clipboard-text-outline" },
  { id: "more", label: "Thêm", icon: "dots-horizontal-circle-outline" },
];

const railTabs: Array<{ id: SellerTab; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Tổng quan", icon: "home" },
  { id: "routes", label: "Tuyến đường", icon: "map-marker-path" },
  { id: "visits", label: "Ghé thăm", icon: "map-marker-check-outline" },
  { id: "orders", label: "Đơn hàng", icon: "clipboard-text-outline" },
  { id: "customers", label: "Khách hàng", icon: "storefront-outline" },
  { id: "kpis", label: "KPI / Chỉ tiêu", icon: "chart-bar" },
  { id: "leaves", label: "Nghỉ phép", icon: "calendar-clock" },
  { id: "notifications", label: "Thông báo", icon: "bell-outline" },
  { id: "profile", label: "Hồ sơ", icon: "account-circle-outline" },
];

const nativeTabBarHeight = 67;

export function AppShell({
  activeTab,
  children,
  user,
  onChangeTab,
  onLogout,
}: {
  activeTab: SellerTab;
  children: ReactNode;
  user: AuthUser;
  onChangeTab: (tab: SellerTab) => void;
  onLogout: () => void;
}) {
  const { refresh, refreshing } = useRefresh();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showDesktop = Platform.OS === "web" && width >= 900;
  const bottom = Math.max(insets.bottom, 0);
  const nativeMobile = Platform.OS !== "web";
  const nativeTabBottomPadding = Math.max(bottom, 8);

  return (
    <View style={styles.shell}>
      {showDesktop ? (
        <View style={styles.desktopRail}>
          <View style={styles.railContent}>
            <View style={styles.railBrand}>
              <View style={styles.brandMark}>
                <MaterialCommunityIcons name="cube-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.brandName}>DMS</Text>
                <Text style={styles.brandSub}>Seller console</Text>
              </View>
            </View>

            <View style={styles.railDivider} />

            <View style={styles.railNav}>
              {railTabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="button"
                    accessibilityLabel={tab.label}
                    onPress={() => onChangeTab(tab.id)}
                    style={({ pressed }) => [styles.railItem, active && styles.railItemActive, pressed && styles.pressed]}
                  >
                    <View style={[styles.railIcon, active && styles.railIconActive]}>
                      <MaterialCommunityIcons name={tab.icon} size={18} color={active ? bento.primary : "#AEBBD0"} />
                    </View>
                    <Text style={[styles.railText, active && styles.railTextActive]} numberOfLines={1}>{tab.label}</Text>
                    {active ? <View style={styles.railActiveDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.railFooter}>
            <View style={styles.railUser}>
              <View style={styles.railAvatar}>
                <Text style={styles.railAvatarText}>{initial(user.fullName || user.email)}</Text>
              </View>
              <View style={styles.railUserText}>
                <Text style={styles.railUserName} numberOfLines={1}>{user.fullName || user.email}</Text>
                <Text style={styles.railUserRole}>Đang hoạt động</Text>
              </View>
            </View>
            <Pressable onPress={onLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="logout" size={17} color="#FCA5A5" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.workspace, !showDesktop && styles.workspaceMobile]}>
        {showDesktop ? (
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topEyebrow}>ENTERPRISE FIELD SALES</Text>
              <Text style={styles.topTitle}>{activeTitle(activeTab)}</Text>
            </View>
            <View style={styles.topActions}>
              <Pressable
                onPress={() => { void refresh(); }}
                disabled={refreshing}
                style={({ pressed }) => [styles.syncButton, pressed && styles.pressed, refreshing && styles.syncButtonBusy]}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={bento.primary} />
                ) : (
                  <MaterialCommunityIcons name="sync" size={17} color={bento.primary} />
                )}
                <Text style={styles.syncText}>{refreshing ? "Đang đồng bộ" : "Đồng bộ"}</Text>
              </Pressable>
              <View style={styles.userPill}>
                <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{initial(user.fullName || user.email)}</Text></View>
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>{user.fullName || user.email}</Text>
                  <Text style={styles.userRole}>Seller</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.phone, showDesktop && styles.phoneDesktop, !showDesktop && styles.phoneMobile]}>
          {activeTab === "dashboard" ? (
            <View pointerEvents="none" style={styles.dashboardBackdrop}>
              <View style={styles.dashboardBackdropHero} />
              <View style={styles.dashboardBackdropBody} />
            </View>
          ) : null}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              showDesktop && styles.contentDesktop,
              activeTab === "dashboard" && styles.contentDashboard,
              nativeMobile && { paddingBottom: nativeTabBarHeight + nativeTabBottomPadding + 18 },
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={activeTab === "dashboard" ? "#FFFFFF" : bento.primary} colors={[bento.primary]} />}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <View style={[styles.bottomNav, nativeMobile && styles.bottomNavNative, nativeMobile && { paddingBottom: nativeTabBottomPadding }]}>
            <View style={styles.bottomTabs}>
              {primaryTabs.map((tab) => {
                const active = activeTab === tab.id || (tab.id === "more" && moreActive(activeTab));
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="button"
                    accessibilityLabel={tab.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => onChangeTab(tab.id)}
                    style={({ pressed }) => [styles.bottomItem, pressed && styles.pressed]}
                  >
                    <View style={[styles.bottomIconWrap, active && styles.bottomIconWrapActive]}>
                      <MaterialCommunityIcons name={tab.icon} size={21} color={active ? bento.primary : bento.textSecondary} />
                    </View>
                    <Text style={[styles.bottomText, active && styles.bottomTextActive]} numberOfLines={1}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function activeTitle(tab: SellerTab) {
  return railTabs.find((item) => item.id === tab)?.label || "Công cụ";
}

function moreActive(tab: SellerTab) {
  return tab === "routes" || tab === "kpis" || tab === "leaves" || tab === "notifications" || tab === "profile";
}

function initial(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "S";
}

const styles = StyleSheet.create({
  shell: { backgroundColor: bento.background, flex: 1, flexDirection: "row", position: "relative" },
  desktopRail: { backgroundColor: bento.chrome, borderRightColor: "rgba(255,255,255,0.08)", borderRightWidth: 1, justifyContent: "space-between", maxWidth: 268, minWidth: 248, padding: 18 },
  railContent: { gap: 16 },
  railBrand: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 6, paddingVertical: 8 },
  brandMark: { alignItems: "center", backgroundColor: bento.primary, borderColor: "rgba(255,255,255,0.20)", borderRadius: 13, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  brandName: { color: "#fff", fontSize: 17, fontWeight: "900", lineHeight: 20 },
  brandSub: { color: "#9FAEC5", fontSize: 12, fontWeight: "800" },
  railDivider: { backgroundColor: "rgba(255,255,255,0.08)", height: 1, marginHorizontal: 6 },
  railNav: { gap: 4 },
  railItem: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 10, minHeight: 46, paddingHorizontal: 10 },
  railItemActive: { backgroundColor: "rgba(255,255,255,0.11)", borderColor: "rgba(255,255,255,0.08)", borderWidth: 1 },
  railIcon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  railIconActive: { backgroundColor: "#fff" },
  railText: { color: "#B7C2D6", flex: 1, fontSize: 13, fontWeight: "800" },
  railTextActive: { color: "#fff", fontWeight: "900" },
  railActiveDot: { backgroundColor: bento.primary, borderRadius: 4, height: 8, width: 8 },
  railFooter: { borderTopColor: "rgba(255,255,255,0.08)", borderTopWidth: 1, gap: 10, paddingTop: 14 },
  railUser: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, padding: 10 },
  railAvatar: { alignItems: "center", backgroundColor: "#fff", borderRadius: 11, height: 34, justifyContent: "center", width: 34 },
  railAvatarText: { color: bento.primary, fontSize: 13, fontWeight: "900" },
  railUserText: { flex: 1, minWidth: 0 },
  railUserName: { color: "#fff", fontSize: 13, fontWeight: "900" },
  railUserRole: { color: "#9FAEC5", fontSize: 11, fontWeight: "800", marginTop: 2 },
  logoutButton: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 8, minHeight: 42, paddingHorizontal: 10 },
  logoutText: { color: "#FCA5A5", fontSize: 13, fontWeight: "900" },
  workspace: { alignItems: "center", flex: 1, paddingHorizontal: 28, paddingVertical: 20 },
  workspaceMobile: { paddingHorizontal: 0, paddingVertical: 0 },
  topBar: { alignItems: "center", alignSelf: "stretch", flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  topEyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 0 },
  topTitle: { color: bento.text, fontSize: 27, fontWeight: "900", marginTop: 2 },
  topActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  syncButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 12, ...bentoSoftShadow },
  syncButtonBusy: { opacity: 0.72 },
  syncText: { color: bento.primary, fontSize: 12, fontWeight: "900" },
  userPill: { alignItems: "center", backgroundColor: bento.glass, borderColor: "#fff", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 8, ...bentoSoftShadow },
  userAvatar: { alignItems: "center", backgroundColor: bento.chrome, borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  userAvatarText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  userMeta: { maxWidth: 180 },
  userName: { color: bento.text, fontSize: 13, fontWeight: "900" },
  userRole: { color: bento.textSecondary, fontSize: 11, fontWeight: "800" },
  phone: { backgroundColor: bento.background, borderColor: "rgba(255,255,255,0.86)", borderRadius: 24, borderWidth: 1, flex: 1, maxWidth: 540, overflow: "hidden", position: "relative", width: "100%", ...bentoShadow },
  phoneDesktop: { borderRadius: 18, maxWidth: 1120 },
  phoneMobile: { borderRadius: 0, borderWidth: 0, maxWidth: "100%" },
  scroll: { backgroundColor: "transparent" },
  dashboardBackdrop: { ...StyleSheet.absoluteFillObject },
  dashboardBackdropHero: { backgroundColor: bento.chrome, flex: 1 },
  dashboardBackdropBody: { backgroundColor: bento.surface, flex: 1 },
  content: { alignSelf: "center", backgroundColor: bento.background, maxWidth: 520, minHeight: "100%", paddingBottom: 102, width: "100%" },
  contentDashboard: { backgroundColor: bento.surface },
  contentDesktop: { maxWidth: 1080 },
  bottomNav: { alignSelf: "center", backgroundColor: "rgba(255,255,255,0.95)", borderColor: "rgba(224,231,242,0.94)", borderRadius: 18, borderWidth: 1, bottom: 10, left: 12, maxWidth: 516, paddingHorizontal: 8, paddingTop: 5, position: Platform.OS === "web" ? "fixed" as never : "absolute", right: 12, width: "auto" as never, ...bentoShadow },
  bottomNavNative: { backgroundColor: bento.surface, borderRadius: 0, borderWidth: 0, borderTopColor: bento.border, borderTopWidth: 1, bottom: 0, left: 0, maxWidth: "100%", paddingHorizontal: 8, right: 0 },
  bottomTabs: { alignItems: "center", flexDirection: "row", minHeight: 56 },
  bottomItem: { alignItems: "center", flex: 1, gap: 2, justifyContent: "center", minHeight: 50, position: "relative" },
  bottomIconWrap: { alignItems: "center", borderRadius: 999, height: 30, justifyContent: "center", width: 42 },
  bottomIconWrapActive: { backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderWidth: 1 },
  bottomText: { color: bento.textSecondary, fontSize: 10, fontWeight: "700", lineHeight: 12 },
  bottomTextActive: { color: bento.primary, fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
