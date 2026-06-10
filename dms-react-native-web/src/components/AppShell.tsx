import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRefresh } from "../hooks/RefreshContext";
import { atlas, atlasSoftShadow } from "../theme";
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

const primaryTabs: Array<{
  id: SellerTab;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  color: string;
}> = [
  {
    id: "dashboard",
    label: "Tổng quan",
    icon: "home-outline",
    activeIcon: "home",
    color: atlas.primary,
  },
  {
    id: "customers",
    label: "Khách",
    icon: "storefront-outline",
    activeIcon: "storefront",
    color: atlas.customer,
  },
  {
    id: "visits",
    label: "Ghé thăm",
    icon: "map-marker-check-outline",
    activeIcon: "map-marker-check",
    color: atlas.visit,
  },
  {
    id: "orders",
    label: "Đơn hàng",
    icon: "clipboard-text-outline",
    activeIcon: "clipboard-text",
    color: atlas.order,
  },
  {
    id: "more",
    label: "Khác",
    icon: "dots-horizontal-circle-outline",
    activeIcon: "dots-horizontal-circle",
    color: atlas.primaryDark,
  },
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

const nativeTabBarHeight = 78;

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
  const nativeMobile = Platform.OS !== "web";
  const nativeNavBottom = Math.max(insets.bottom, 8);

  return (
    <View style={styles.shell}>
      {showDesktop ? (
        <View style={styles.desktopRail}>
          <View style={styles.railContent}>
            <View style={styles.railBrand}>
              <View style={styles.brandMark}>
                <MaterialCommunityIcons
                  name="water-outline"
                  size={20}
                  color="#fff"
                />
              </View>
              <View>
                <Text style={styles.brandName}>DMS Sales</Text>
                <Text style={styles.brandSub}>Bán hàng</Text>
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
                    style={(state) => [
                      styles.railItem,
                      isHovered(state) && !active && styles.railItemHover,
                      active && styles.railItemActive,
                      state.pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[styles.railIcon, active && styles.railIconActive]}
                    >
                      <MaterialCommunityIcons
                        name={tab.icon}
                        size={18}
                        color={active ? "#FFFFFF" : atlas.textMuted}
                      />
                    </View>
                    <Text
                      style={[styles.railText, active && styles.railTextActive]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                    {active ? <View style={styles.railActiveDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.railFooter}>
            <View style={styles.railUser}>
              <View style={styles.railAvatar}>
                <Text style={styles.railAvatarText}>
                  {initial(user.fullName || user.email)}
                </Text>
              </View>
              <View style={styles.railUserText}>
                <Text style={styles.railUserName} numberOfLines={1}>
                  {user.fullName || user.email}
                </Text>
                <Text style={styles.railUserRole}>Seller</Text>
              </View>
            </View>
            <Pressable
              onPress={onLogout}
              style={(state) => [
                styles.logoutButton,
                isHovered(state) && styles.logoutButtonHover,
                state.pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons name="logout" size={17} color="#FCA5A5" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.workspace, !showDesktop && styles.workspaceMobile]}>
        {showDesktop ? (
          <View style={styles.topBar}>
            <Text style={styles.topTitle}>{activeTitle(activeTab)}</Text>
            <View style={styles.topActions}>
              <Pressable
                onPress={() => {
                  void refresh();
                }}
                disabled={refreshing}
                style={(state) => [
                  styles.syncButton,
                  isHovered(state) && !refreshing && styles.syncButtonHover,
                  state.pressed && styles.pressed,
                  refreshing && styles.syncButtonBusy,
                ]}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={atlas.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name="sync"
                    size={17}
                    color={atlas.primary}
                  />
                )}
                <Text style={styles.syncText}>
                  {refreshing ? "Đang đồng bộ" : "Đồng bộ"}
                </Text>
              </Pressable>
              <View style={styles.userPill}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {initial(user.fullName || user.email)}
                  </Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.fullName || user.email}
                  </Text>
                  <Text style={styles.userRole}>Nhân viên bán hàng</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.phone,
            showDesktop && styles.phoneDesktop,
            !showDesktop && styles.phoneMobile,
          ]}
        >
          {activeTab === "dashboard" ? (
            <View pointerEvents="none" style={styles.dashboardBackdrop}>
              <View style={styles.dashboardBackdropHero} />
              <View style={styles.dashboardBackdropBody} />
            </View>
          ) : null}
          {nativeMobile ? (
            <View pointerEvents="none" style={styles.nativePullBackdrop} />
          ) : null}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              showDesktop && styles.contentDesktop,
              activeTab === "dashboard" && styles.contentDashboard,
              nativeMobile && {
                paddingBottom: nativeTabBarHeight + nativeNavBottom + 18,
              },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={nativeMobile ? "#FFFFFF" : atlas.primary}
                colors={nativeMobile ? ["#FFFFFF"] : [atlas.primary]}
                progressBackgroundColor="#103494"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <View
            style={[
              styles.bottomNav,
              nativeMobile && styles.bottomNavNative,
              nativeMobile && {
                bottom: nativeNavBottom,
                paddingBottom: 7,
              },
            ]}
          >
            <View style={styles.bottomTabs}>
              {primaryTabs.map((tab) => {
                const active =
                  activeTab === tab.id ||
                  (tab.id === "more" && moreActive(activeTab));
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="button"
                    accessibilityLabel={tab.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => onChangeTab(tab.id)}
                    style={(state) => [
                      styles.bottomItem,
                      active && styles.bottomItemActive,
                      active && { borderColor: tab.color },
                      state.pressed && styles.bottomItemPressed,
                    ]}
                  >
                    {active ? (
                      <View
                        style={[
                          styles.bottomActiveBar,
                          { backgroundColor: tab.color },
                        ]}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.bottomIconWrap,
                        active && styles.bottomIconWrapActive,
                        active && {
                          backgroundColor: tab.color,
                          borderColor: tab.color,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={active ? tab.activeIcon : tab.icon}
                        size={active ? 22 : 21}
                        color={active ? "#FFFFFF" : atlas.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.bottomText,
                        active && styles.bottomTextActive,
                        active && { color: tab.color },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
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
  return (
    tab === "routes" ||
    tab === "kpis" ||
    tab === "leaves" ||
    tab === "notifications" ||
    tab === "profile"
  );
}

function initial(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "S";
}

function isHovered(state: { pressed: boolean }) {
  return Boolean((state as { hovered?: boolean }).hovered);
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: atlas.background,
    flex: 1,
    flexDirection: "row",
    position: "relative",
  },
  desktopRail: {
    backgroundColor: atlas.chrome,
    borderRightColor: atlas.border,
    borderRightWidth: 1,
    justifyContent: "space-between",
    maxWidth: 250,
    minWidth: 232,
    padding: 16,
  },
  railContent: { gap: 16 },
  railBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: atlas.primary,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  brandName: {
    color: atlas.text,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 20,
  },
  brandSub: { color: atlas.textMuted, fontSize: 12, fontWeight: "600" },
  railDivider: {
    backgroundColor: atlas.border,
    height: 1,
    marginHorizontal: 6,
  },
  railNav: { gap: 6 },
  railItem: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  railItemActive: {
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
  },
  railItemHover: {
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
  },
  railIcon: {
    alignItems: "center",
    backgroundColor: atlas.surfaceAlt,
    borderRadius: 6,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  railIconActive: { backgroundColor: atlas.primary },
  railText: {
    color: atlas.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  railTextActive: { color: atlas.primaryDark, fontWeight: "700" },
  railActiveDot: {
    backgroundColor: atlas.primary,
    borderRadius: 2,
    height: 18,
    width: 3,
  },
  railFooter: {
    borderTopColor: atlas.border,
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 14,
  },
  railUser: {
    alignItems: "center",
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  railAvatar: {
    alignItems: "center",
    backgroundColor: atlas.primary,
    borderRadius: 6,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  railAvatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  railUserText: { flex: 1, minWidth: 0 },
  railUserName: { color: atlas.text, fontSize: 13, fontWeight: "700" },
  railUserRole: {
    color: atlas.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutButton: {
    alignItems: "center",
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  logoutButtonHover: {
    backgroundColor: atlas.dangerSoft,
    borderColor: atlas.dangerSoft,
  },
  logoutText: { color: atlas.danger, fontSize: 13, fontWeight: "700" },
  workspace: {
    alignItems: "center",
    backgroundColor: atlas.background,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  workspaceMobile: { paddingHorizontal: 0, paddingVertical: 0 },
  topBar: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topTitle: {
    color: atlas.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  topActions: { alignItems: "center", flexDirection: "row", gap: 10 },
  syncButton: {
    alignItems: "center",
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  syncButtonHover: {
    backgroundColor: atlas.surface,
    borderColor: atlas.primary,
  },
  syncButtonBusy: { opacity: 0.72 },
  syncText: { color: atlas.primary, fontSize: 12, fontWeight: "700" },
  userPill: {
    alignItems: "center",
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 6,
  },
  userAvatar: {
    alignItems: "center",
    backgroundColor: atlas.primary,
    borderRadius: 6,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  userAvatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  userMeta: { maxWidth: 180 },
  userName: { color: atlas.text, fontSize: 13, fontWeight: "700" },
  userRole: { color: atlas.textSecondary, fontSize: 11, fontWeight: "600" },
  phone: {
    backgroundColor: atlas.background,
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    maxWidth: 540,
    overflow: "hidden",
    position: "relative",
    width: "100%",
    ...atlasSoftShadow,
  },
  phoneDesktop: { borderRadius: 8, maxWidth: 1120 },
  phoneMobile: { borderRadius: 0, borderWidth: 0, maxWidth: "100%" },
  scroll: { backgroundColor: "transparent" },
  nativePullBackdrop: {
    backgroundColor: "#103494",
    height: 240,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  dashboardBackdrop: { ...StyleSheet.absoluteFillObject },
  dashboardBackdropHero: { backgroundColor: atlas.background, flex: 1 },
  dashboardBackdropBody: { backgroundColor: atlas.background, flex: 1 },
  content: {
    alignSelf: "center",
    backgroundColor: atlas.background,
    maxWidth: 520,
    minHeight: "100%",
    paddingBottom: 104,
    width: "100%",
  },
  contentDashboard: { backgroundColor: atlas.background },
  contentDesktop: { maxWidth: 1080 },
  bottomNav: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    bottom: 10,
    left: 12,
    maxWidth: 520,
    paddingHorizontal: 8,
    paddingVertical: 7,
    position: "absolute",
    right: 12,
    shadowColor: atlas.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 10,
  },
  bottomNavNative: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    left: 12,
    maxWidth: 520,
    right: 12,
  },
  bottomTabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minHeight: 62,
  },
  bottomItem: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 57,
    paddingTop: 5,
    position: "relative",
  },
  bottomItemActive: {
    backgroundColor: "#FFFFFF",
    borderColor: atlas.borderStrong,
  },
  bottomItemPressed: { opacity: 0.84 },
  bottomActiveBar: {
    backgroundColor: atlas.primary,
    borderRadius: 2,
    height: 3,
    position: "absolute",
    top: 4,
    width: 20,
  },
  bottomIconWrap: {
    alignItems: "center",
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 42,
    shadowColor: atlas.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  bottomIconWrapActive: {
    backgroundColor: atlas.primary,
    borderColor: atlas.primary,
  },
  bottomText: {
    color: atlas.textMuted,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 13,
  },
  bottomTextActive: { color: atlas.primaryDark, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
