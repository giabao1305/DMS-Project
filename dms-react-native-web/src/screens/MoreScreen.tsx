import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { SellerTab } from "../components/AppShell";
import type { AuthUser } from "../types/domain";
import { bento, bentoSoftShadow } from "../theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type MenuItem = {
  title: string;
  subtitle: string;
  icon: IconName;
  tab?: SellerTab;
  color: string;
  bg: string;
  danger?: boolean;
};

const workItems: MenuItem[] = [
  {
    title: "Tuyến đường",
    subtitle: "Lịch tuyến và điểm bán",
    icon: "map-marker-path",
    tab: "routes",
    color: bento.route,
    bg: bento.routeSoft,
  },
  {
    title: "KPI / Chỉ tiêu",
    subtitle: "Mục tiêu và hiệu suất",
    icon: "chart-box-outline",
    tab: "kpis",
    color: "#6D28D9",
    bg: "#F5F3FF",
  },
  {
    title: "Nghỉ phép",
    subtitle: "Tạo và theo dõi đơn nghỉ",
    icon: "calendar-clock",
    tab: "leaves",
    color: bento.warning,
    bg: bento.warningSoft,
  },
];

const accountItems: MenuItem[] = [
  {
    title: "Thông báo",
    subtitle: "Cập nhật mới nhất",
    icon: "bell-outline",
    tab: "notifications",
    color: bento.danger,
    bg: bento.dangerSoft,
  },
  {
    title: "Hồ sơ cá nhân",
    subtitle: "Thông tin tài khoản",
    icon: "account-circle-outline",
    tab: "profile",
    color: bento.primary,
    bg: bento.primarySoft,
  },
  {
    title: "Đăng xuất",
    subtitle: "Kết thúc phiên làm việc",
    icon: "logout",
    color: bento.danger,
    bg: bento.dangerSoft,
    danger: true,
  },
];

export function MoreScreen({
  user,
  onOpenTab,
  onLogout,
}: {
  user: AuthUser;
  onOpenTab: (tab: SellerTab) => void;
  onLogout: () => void;
}) {
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.page}>
          <View style={styles.headerCard}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Khác</Text>
              <Text style={styles.subtitle}>Công cụ bán hàng và tài khoản</Text>
            </View>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons
                name="view-grid-plus-outline"
                size={24}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initial(user.fullName || user.email)}
              </Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.fullName || user.email}
              </Text>
              <Text style={styles.userMeta} numberOfLines={1}>
                Nhân viên bán hàng - {user.isActive ? "Đang hoạt động" : "Tạm khóa"}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                !user.isActive && styles.statusBadgeOff,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  !user.isActive && styles.statusTextOff,
                ]}
              >
                {user.isActive ? "Online" : "Khóa"}
              </Text>
            </View>
          </View>

          <MenuSection
            title="Công việc"
            items={workItems}
            onOpenTab={onOpenTab}
            onLogout={() => setLogoutOpen(true)}
          />
          <MenuSection
            title="Tài khoản"
            items={accountItems}
            onOpenTab={onOpenTab}
            onLogout={() => setLogoutOpen(true)}
          />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={logoutOpen}
        onRequestClose={() => setLogoutOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Đóng"
            style={styles.modalBackdrop}
            onPress={() => setLogoutOpen(false)}
          />
          <View style={styles.confirmModal}>
            <View style={styles.confirmIcon}>
              <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.confirmTitle}>Đăng xuất?</Text>
            <Text style={styles.confirmMessage}>
              Bạn sẽ cần đăng nhập lại để tiếp tục công việc.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setLogoutOpen(false)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setLogoutOpen(false);
                  onLogout();
                }}
                style={({ pressed }) => [
                  styles.logoutConfirmButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.logoutConfirmText}>Đăng xuất</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function MenuSection({
  title,
  items,
  onOpenTab,
  onLogout,
}: {
  title: string;
  items: MenuItem[];
  onOpenTab: (tab: SellerTab) => void;
  onLogout: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuList}>
        {items.map((item) => (
          <View key={item.title} style={styles.rowWrap}>
            <Pressable
              onPress={() => (item.tab ? onOpenTab(item.tab) : onLogout())}
              style={({ pressed }) => [
                styles.row,
                { borderColor: item.bg, borderLeftColor: item.color },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, item.danger && styles.dangerText]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <View style={styles.chevronBox}>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={21}
                  color={item.color}
                />
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function initial(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "S";
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 16,
    width: "100%",
  },
  headerCard: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftColor: bento.primary,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    ...bentoSoftShadow,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: bento.text, fontSize: 22, fontWeight: "700" },
  subtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderColor: bento.primary,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  userCard: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 13,
    ...bentoSoftShadow,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  avatarText: { color: bento.primaryDark, fontSize: 17, fontWeight: "700" },
  userText: { flex: 1, minWidth: 0 },
  userName: { color: bento.text, fontSize: 15, fontWeight: "700" },
  userMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: bento.successSoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusBadgeOff: { backgroundColor: bento.dangerSoft, borderColor: "#FECACA" },
  statusText: { color: bento.success, fontSize: 11, fontWeight: "700" },
  statusTextOff: { color: bento.danger },
  section: { gap: 10 },
  sectionTitle: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
  menuList: { gap: 10 },
  rowWrap: { borderRadius: 8 },
  row: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 70,
    paddingHorizontal: 13,
    paddingVertical: 11,
    ...bentoSoftShadow,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  rowSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  dangerText: { color: bento.danger },
  chevronBox: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  modalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: bento.overlay },
  confirmModal: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    maxWidth: 360,
    padding: 20,
    width: "100%",
    ...bentoSoftShadow,
  },
  confirmIcon: {
    alignItems: "center",
    backgroundColor: bento.danger,
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    marginBottom: 4,
    width: 52,
  },
  confirmTitle: { color: bento.text, fontSize: 20, fontWeight: "700" },
  confirmMessage: {
    color: bento.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 9,
    textAlign: "center",
  },
  confirmActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  cancelButton: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButtonText: { color: bento.text, fontSize: 15, fontWeight: "600" },
  logoutConfirmButton: {
    alignItems: "center",
    backgroundColor: bento.danger,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  logoutConfirmText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
