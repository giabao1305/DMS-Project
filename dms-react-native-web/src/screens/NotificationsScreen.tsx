import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { EmptyState, ErrorBanner, LoadingState } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoSoftShadow } from "../theme";
import type { Notification, NotificationType } from "../types/domain";
import { shortDateTime } from "../utils/format";
import { NotificationDetail } from "./notifications/NotificationDetail";

type FilterKey = "all" | "unread" | "read";
type TypeFilter = "all" | NotificationType;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "read", label: "Đã đọc" },
];

export function NotificationsScreen({
  onOpenTab,
}: {
  onOpenTab: (tab: SellerTab) => void;
}) {
  const { data, loading, error, reload } = useResource(
    sellerApi.notifications,
    [],
  );
  useRegisterRefresh(reload, [reload]);
  const [detail, setDetail] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");

  const notifications = data || [];
  const unread = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );
  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(notifications.map((item) => item.type)));
    return types.length ? types : [];
  }, [notifications]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return notifications.filter((item) => {
      if (filter === "unread" && item.isRead) return false;
      if (filter === "read" && !item.isRead) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!keyword) return true;
      return [item.title, item.message, typeLabel(item.type)].some((value) =>
        value.toLowerCase().includes(keyword),
      );
    });
  }, [filter, notifications, query, typeFilter]);

  const markOne = async (id: string) => {
    await sellerApi.markAsRead(id);
    await reload();
    setDetail((current) =>
      current && current._id === id ? { ...current, isRead: true } : current,
    );
  };

  const markAll = async () => {
    await sellerApi.markAllAsRead();
    await reload();
  };

  if (loading) return <LoadingState variant="list" />;
  if (detail)
    return (
      <NotificationDetail
        notification={detail}
        onBack={() => setDetail(null)}
        onMarkRead={markOne}
        onOpenTab={onOpenTab}
      />
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            onPress={() => onOpenTab("more")}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Thông báo</Text>
          </View>
          <Pressable
            onPress={markAll}
            disabled={unread === 0}
            style={({ pressed }) => [
              styles.markAllButton,
              pressed && styles.pressed,
              unread === 0 && styles.disabled,
            ]}
          >
            <MaterialCommunityIcons
              name="check-all"
              size={17}
              color="#FFFFFF"
            />
            <Text
              style={[
                styles.markAllText,
                unread === 0 && styles.markAllTextDisabled,
              ]}
            >
              Đã đọc
            </Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={({ pressed }) => [
                styles.filterChip,
                filter === item.key && styles.filterChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
              {item.key !== "read" ? (
                <Text
                  style={[
                    styles.filterCount,
                    filter === item.key && styles.filterCountActive,
                  ]}
                >
                  {item.key === "all" ? notifications.length : unread}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={bento.textMuted}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm tiêu đề, nội dung thông báo..."
            placeholderTextColor={bento.textMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFilterRow}
        >
          <TypeChip
            label="Tất cả loại"
            active={typeFilter === "all"}
            onPress={() => setTypeFilter("all")}
          />
          {typeOptions.map((type) => (
            <TypeChip
              key={type}
              label={typeLabel(type)}
              active={typeFilter === type}
              onPress={() => setTypeFilter(type)}
            />
          ))}
        </ScrollView>

        <ErrorBanner message={error} />

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Danh sách thông báo</Text>
              <Text style={styles.sectionHint}>{filtered.length} kết quả</Text>
            </View>
            <MaterialCommunityIcons
              name="tune-variant"
              size={21}
              color={bento.textMuted}
            />
          </View>
          {filtered.length === 0 ? (
            <EmptyState
              title="Không có thông báo"
              message={
                notifications.length
                  ? "Thử đổi từ khóa hoặc bộ lọc thông báo."
                  : "Thông báo mới sẽ xuất hiện tại đây."
              }
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <NotificationRow
                  key={item._id}
                  item={item}
                  onPress={() => setDetail(item)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function TypeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeChip,
        active && styles.typeChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: Notification;
  onPress: () => void;
}) {
  const tone = notificationTone(item.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderLeftColor: tone.color },
        !item.isRead && styles.rowUnread,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: tone.color }]}>
        <MaterialCommunityIcons name={tone.icon} size={21} color="#FFFFFF" />
        {!item.isRead ? <View style={styles.unreadDot} /> : null}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowTime}>{shortTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.rowMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.rowMeta}>
          <Text
            style={[
              styles.typeTag,
              { color: tone.color, backgroundColor: tone.bg },
            ]}
          >
            {typeLabel(item.type)}
          </Text>
          <Text style={styles.rowDate}>{shortDateTime(item.createdAt)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={bento.textMuted}
      />
    </Pressable>
  );
}

function notificationTone(type: Notification["type"]): {
  icon: IconName;
  color: string;
  bg: string;
} {
  if (type === "order")
    return {
      icon: "cart-outline",
      color: "#059669",
      bg: "#ECFDF5",
    };
  if (type === "route")
    return {
      icon: "map-marker-path",
      color: "#2563EB",
      bg: "#EFF6FF",
    };
  if (type === "visit")
    return {
      icon: "map-marker-check-outline",
      color: "#0891B2",
      bg: "#ECFEFF",
    };
  if (type === "leave")
    return {
      icon: "calendar-clock",
      color: "#D97706",
      bg: "#FFFBEB",
    };
  if (type === "inventory")
    return {
      icon: "package-variant-closed",
      color: "#64748B",
      bg: "#F8FAFC",
    };
  if (type === "promotion")
    return { icon: "ticket-percent-outline", color: "#6D28D9", bg: "#F5F3FF" };
  return {
    icon: "bell-outline",
    color: "#0F766E",
    bg: "#F0FDFA",
  };
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
  return parsed.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 16,
    width: "100%",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#103494",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginHorizontal: -20,
    marginTop: -18,
    minHeight: 70,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  markAllButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  markAllText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  markAllTextDisabled: { color: bento.textMuted },
  hero: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    ...bentoSoftShadow,
  },
  heroLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "600" },
  heroValue: {
    color: bento.text,
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 48,
    marginTop: 4,
  },
  heroSub: { color: bento.textSecondary, fontSize: 13, fontWeight: "600" },
  heroIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 10,
    ...bentoSoftShadow,
  },
  filterChipActive: {
    backgroundColor: bento.primary,
    borderColor: bento.primary,
  },
  filterText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#fff" },
  filterCount: { color: bento.danger, fontSize: 11, fontWeight: "700" },
  filterCountActive: { color: "#fff" },
  searchBox: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 48,
    paddingHorizontal: 12,
    ...bentoSoftShadow,
  },
  searchInput: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 0,
    outlineStyle: "none" as never,
  },
  typeFilterRow: { gap: 8, paddingRight: 16 },
  typeChip: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  typeChipActive: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  typeChipText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  typeChipTextActive: { color: bento.primaryDark },
  panel: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...bentoSoftShadow,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: { color: bento.text, fontSize: 17, fontWeight: "700" },
  sectionHint: {
    color: bento.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  list: { gap: 10 },
  row: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 88,
    padding: 12,
  },
  rowUnread: { backgroundColor: "#FFFFFF", borderColor: bento.borderStrong },
  iconBox: {
    alignItems: "center",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    position: "relative",
    width: 46,
  },
  unreadDot: {
    backgroundColor: bento.danger,
    borderColor: "#fff",
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: "absolute",
    right: -1,
    top: -1,
    width: 12,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { alignItems: "center", flexDirection: "row", gap: 8 },
  rowTitle: { color: bento.text, flex: 1, fontSize: 14, fontWeight: "700" },
  rowTime: { color: bento.textSecondary, fontSize: 11, fontWeight: "600" },
  rowMessage: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 4,
  },
  rowDate: { color: bento.textMuted, fontSize: 11, fontWeight: "700" },
  rowMeta: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 8 },
  typeTag: {
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
