import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { EmptyState, ErrorBanner, LoadingState } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoSoftShadow } from "../theme";
import type { Notification } from "../types/domain";
import { shortDateTime } from "../utils/format";
import { NotificationDetail } from "./notifications/NotificationDetail";

type FilterKey = "all" | "unread" | "read";
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "read", label: "Đã đọc" },
];

export function NotificationsScreen({ onOpenTab }: { onOpenTab: (tab: SellerTab) => void }) {
  const { data, loading, error, reload } = useResource(sellerApi.notifications, []);
  useRegisterRefresh(reload, [reload]);
  const [detail, setDetail] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const notifications = data || [];
  const unread = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => !item.isRead);
    if (filter === "read") return notifications.filter((item) => item.isRead);
    return notifications;
  }, [filter, notifications]);

  const markOne = async (id: string) => {
    await sellerApi.markAsRead(id);
    await reload();
    setDetail((current) => (current && current._id === id ? { ...current, isRead: true } : current));
  };

  const markAll = async () => {
    await sellerApi.markAllAsRead();
    await reload();
  };

  if (loading) return <LoadingState variant="list" />;
  if (detail) return <NotificationDetail notification={detail} onBack={() => setDetail(null)} onMarkRead={markOne} onOpenTab={onOpenTab} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>NOTIFICATION CENTER</Text>
            <Text style={styles.title}>Thông báo</Text>
          </View>
          <Pressable onPress={markAll} disabled={unread === 0} style={({ pressed }) => [styles.markAllButton, pressed && styles.pressed, unread === 0 && styles.disabled]}>
            <MaterialCommunityIcons name="check-all" size={17} color={unread === 0 ? bento.textMuted : bento.primary} />
            <Text style={[styles.markAllText, unread === 0 && styles.markAllTextDisabled]}>Đã đọc</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>Tin mới hôm nay</Text>
            <Text style={styles.heroValue}>{unread}</Text>
            <Text style={styles.heroSub}>thông báo chưa đọc</Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="bell-ring-outline" size={30} color={bento.primaryDark} />
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Pressable key={item.key} onPress={() => setFilter(item.key)} style={({ pressed }) => [styles.filterChip, filter === item.key && styles.filterChipActive, pressed && styles.pressed]}>
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
              {item.key !== "read" ? <Text style={[styles.filterCount, filter === item.key && styles.filterCountActive]}>{item.key === "all" ? notifications.length : unread}</Text> : null}
            </Pressable>
          ))}
        </View>

        <ErrorBanner message={error} />

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Danh sách thông báo</Text>
              <Text style={styles.sectionHint}>{filtered.length} kết quả</Text>
            </View>
            <MaterialCommunityIcons name="tune-variant" size={21} color={bento.textMuted} />
          </View>
          {filtered.length === 0 ? (
            <EmptyState title="Không có thông báo" message="Thông báo mới sẽ xuất hiện tại đây." />
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => <NotificationRow key={item._id} item={item} onPress={() => setDetail(item)} />)}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function NotificationRow({ item, onPress }: { item: Notification; onPress: () => void }) {
  const tone = notificationTone(item.type);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !item.isRead && styles.rowUnread, pressed && styles.pressed]}>
      <View style={[styles.iconBox, { backgroundColor: tone.bg }]}>
        <MaterialCommunityIcons name={tone.icon} size={21} color={tone.color} />
        {!item.isRead ? <View style={styles.unreadDot} /> : null}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.rowTime}>{shortTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.rowMessage} numberOfLines={2}>{item.message}</Text>
        <View style={styles.rowMeta}>
          <Text style={[styles.typeTag, { color: tone.color, backgroundColor: tone.bg }]}>{typeLabel(item.type)}</Text>
          <Text style={styles.rowDate}>{shortDateTime(item.createdAt)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={bento.textMuted} />
    </Pressable>
  );
}

function notificationTone(type: Notification["type"]): { icon: IconName; color: string; bg: string } {
  if (type === "order") return { icon: "cart-outline", color: bento.success, bg: bento.successSoft };
  if (type === "route") return { icon: "map-marker-path", color: bento.primary, bg: bento.primarySoft };
  if (type === "visit") return { icon: "map-marker-check-outline", color: bento.primary, bg: bento.primarySoft };
  if (type === "leave") return { icon: "calendar-clock", color: bento.warning, bg: bento.warningSoft };
  if (type === "inventory") return { icon: "package-variant-closed", color: bento.textSecondary, bg: bento.surfaceAlt };
  if (type === "promotion") return { icon: "ticket-percent-outline", color: bento.route, bg: bento.routeSoft };
  return { icon: "bell-outline", color: bento.textSecondary, bg: bento.surfaceAlt };
}

function typeLabel(type: Notification["type"]) {
  if (type === "order") return "Đơn hàng";
  if (type === "route") return "Tuyến";
  if (type === "visit") return "Ghé thăm";
  if (type === "leave") return "Nghỉ phép";
  if (type === "inventory") return "Tồn kho";
  if (type === "promotion") return "Khuyến mãi";
  return "Hệ thống";
}

function shortTime(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: bento.text, fontSize: 24, fontWeight: "900", marginTop: 2 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  markAllButton: { alignItems: "center", backgroundColor: bento.primarySoft, borderRadius: 999, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 9 },
  markAllText: { color: bento.primary, fontSize: 12, fontWeight: "900" },
  markAllTextDisabled: { color: bento.textMuted },
  hero: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 18, ...bentoSoftShadow },
  heroLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  heroValue: { color: bento.text, fontSize: 42, fontWeight: "900", lineHeight: 48, marginTop: 4 },
  heroSub: { color: bento.textSecondary, fontSize: 13, fontWeight: "800" },
  heroIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 22, borderWidth: 1, height: 62, justifyContent: "center", width: 62 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 999, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 40, paddingHorizontal: 10, ...bentoSoftShadow },
  filterChipActive: { backgroundColor: bento.primary, borderColor: bento.primary },
  filterText: { color: bento.textSecondary, fontSize: 12, fontWeight: "900" },
  filterTextActive: { color: "#fff" },
  filterCount: { color: bento.danger, fontSize: 11, fontWeight: "900" },
  filterCountActive: { color: "#fff" },
  panel: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, gap: 12, padding: 14, ...bentoSoftShadow },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: bento.text, fontSize: 17, fontWeight: "900" },
  sectionHint: { color: bento.textMuted, fontSize: 12, fontWeight: "800", marginTop: 3 },
  list: { gap: 10 },
  row: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 88, padding: 12 },
  rowUnread: { backgroundColor: "#FFFFFF", borderColor: bento.borderStrong },
  iconBox: { alignItems: "center", borderRadius: 14, height: 46, justifyContent: "center", position: "relative", width: 46 },
  unreadDot: { backgroundColor: bento.danger, borderColor: "#fff", borderRadius: 6, borderWidth: 2, height: 12, position: "absolute", right: -1, top: -1, width: 12 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { alignItems: "center", flexDirection: "row", gap: 8 },
  rowTitle: { color: bento.text, flex: 1, fontSize: 14, fontWeight: "900" },
  rowTime: { color: bento.textSecondary, fontSize: 11, fontWeight: "800" },
  rowMessage: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 4 },
  rowDate: { color: bento.textMuted, fontSize: 11, fontWeight: "700" },
  rowMeta: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 8 },
  typeTag: { borderRadius: 999, fontSize: 10, fontWeight: "900", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
