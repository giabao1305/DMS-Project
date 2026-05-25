import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { SellerTab } from "../components/AppShell";
import { bento, bentoSoftShadow } from "../theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type MenuItem = {
  title: string;
  description: string;
  icon: IconName;
  tab?: SellerTab;
  color: string;
  bg: string;
  danger?: boolean;
};

const workItems: MenuItem[] = [
  { title: "Tuyến đường", description: "Kế hoạch tuyến và điểm ghé trong ngày", icon: "map-marker-path", tab: "routes", color: bento.route, bg: bento.routeSoft },
  { title: "KPI / Chỉ tiêu", description: "Theo dõi doanh thu, đơn hàng và lượt ghé", icon: "chart-box-outline", tab: "kpis", color: bento.success, bg: bento.successSoft },
  { title: "Nghỉ phép", description: "Tạo đơn nghỉ và theo dõi trạng thái duyệt", icon: "calendar-clock", tab: "leaves", color: bento.warning, bg: bento.warningSoft },
];

const accountItems: MenuItem[] = [
  { title: "Thông báo", description: "Tin hệ thống, đơn hàng và tuyến bán", icon: "bell-outline", tab: "notifications", color: bento.danger, bg: bento.dangerSoft },
  { title: "Hồ sơ cá nhân", description: "Thông tin nhân viên bán hàng và bảo mật", icon: "account-circle-outline", tab: "profile", color: bento.primary, bg: bento.primarySoft },
  { title: "Đăng xuất", description: "Kết thúc phiên làm việc hiện tại", icon: "logout", color: bento.danger, bg: bento.dangerSoft, danger: true },
];

export function MoreScreen({ onOpenTab, onLogout }: { onOpenTab: (tab: SellerTab) => void; onLogout: () => void }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SETTINGS</Text>
            <Text style={styles.title}>Cài đặt</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={bento.primary} />
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="dots-grid" size={29} color={bento.primaryDark} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>DMS Seller</Text>
            <Text style={styles.heroSub}>Quản lý nhanh công việc, tài khoản và hệ thống</Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <QuickTile icon="cart-plus" label="Tạo đơn" color={bento.primary} bg={bento.primarySoft} onPress={() => onOpenTab("orders")} />
          <QuickTile icon="storefront-outline" label="Khách hàng" color={bento.success} bg={bento.successSoft} onPress={() => onOpenTab("customers")} />
          <QuickTile icon="map-marker-check-outline" label="Check-in" color={bento.route} bg={bento.routeSoft} onPress={() => onOpenTab("visits")} />
        </View>

        <MenuSection title="Công việc" items={workItems} onOpenTab={onOpenTab} onLogout={onLogout} />
        <MenuSection title="Tài khoản & hệ thống" items={accountItems} onOpenTab={onOpenTab} onLogout={onLogout} />

        <View style={styles.versionCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={bento.success} />
          <Text style={styles.versionText}>Phiên bản 1.2.0 - Đồng bộ giao diện mockup</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function QuickTile({ icon, label, color, bg, onPress }: { icon: IconName; label: string; color: string; bg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function MenuSection({ title, items, onOpenTab, onLogout }: { title: string; items: MenuItem[]; onOpenTab: (tab: SellerTab) => void; onLogout: () => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.listCard}>
        {items.map((item, index) => (
          <View key={item.title}>
            <Pressable onPress={() => (item.tab ? onOpenTab(item.tab) : onLogout())} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, item.danger && styles.dangerText]} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowDescription} numberOfLines={2}>{item.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={bento.textMuted} />
            </Pressable>
            {index < items.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  title: { color: bento.text, fontSize: 24, fontWeight: "900", marginTop: 2 },
  headerIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  hero: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 13, padding: 17, ...bentoSoftShadow },
  heroIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 19, borderWidth: 1, height: 58, justifyContent: "center", width: 58 },
  heroText: { flex: 1, minWidth: 0 },
  heroTitle: { color: bento.text, fontSize: 20, fontWeight: "900" },
  heroSub: { color: bento.textSecondary, fontSize: 12, fontWeight: "800", lineHeight: 18, marginTop: 4 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickTile: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexBasis: "30%", flexGrow: 1, gap: 8, minHeight: 84, minWidth: 150, padding: 12, ...bentoSoftShadow },
  quickIcon: { alignItems: "center", borderRadius: 13, height: 40, justifyContent: "center", width: 40 },
  quickLabel: { color: bento.text, fontSize: 12, fontWeight: "900", textAlign: "center" },
  section: { gap: 8 },
  sectionTitle: { color: bento.text, fontSize: 15, fontWeight: "900" },
  listCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, overflow: "hidden", ...bentoSoftShadow },
  row: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 76, paddingHorizontal: 14, paddingVertical: 11 },
  iconBox: { alignItems: "center", borderRadius: 13, height: 44, justifyContent: "center", width: 44 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { color: bento.text, fontSize: 15, fontWeight: "900", lineHeight: 20 },
  rowDescription: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 2 },
  dangerText: { color: bento.danger },
  separator: { backgroundColor: bento.border, height: 1, marginLeft: 70 },
  versionCard: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 9, padding: 13, ...bentoSoftShadow },
  versionText: { color: bento.textSecondary, flex: 1, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});

