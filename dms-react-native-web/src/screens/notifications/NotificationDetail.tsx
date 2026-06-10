import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { SellerTab } from "../../components/AppShell";
import { bento, bentoSoftShadow } from "../../theme";
import type { Notification } from "../../types/domain";
import { shortDateTime } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function NotificationDetail({
  notification,
  onBack,
  onMarkRead,
  onOpenTab,
}: {
  notification: Notification;
  onBack: () => void;
  onMarkRead: (id: string) => void;
  onOpenTab: (tab: SellerTab) => void;
}) {
  const relatedTab = tabForNotification(notification);
  const tone = notificationTone(notification.type);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Chi tiết thông báo</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              !notification.isRead && styles.statusPillNew,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                !notification.isRead && styles.statusTextNew,
              ]}
            >
              {notification.isRead ? "Đã đọc" : "Mới"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor: bento.surface,
              borderColor: tone.border,
              borderLeftColor: tone.color,
            },
          ]}
        >
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: tone.color, borderColor: tone.color },
            ]}
          >
            <MaterialCommunityIcons
              name={tone.icon}
              size={29}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.typeLabel}>{typeLabel(notification.type)}</Text>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.timeText}>
            {shortDateTime(notification.createdAt)}
          </Text>
        </View>

        <View style={[styles.contentCard, { borderLeftColor: tone.color }]}>
          <Text style={styles.sectionLabel}>Nội dung</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile
            icon="tag-outline"
            label="Loại"
            value={typeLabel(notification.type)}
            color={tone.color}
            bg={tone.bg}
          />
          <InfoTile
            icon="clock-outline"
            label="Tạo lúc"
            value={shortDateTime(notification.createdAt)}
            color={bento.primary}
            bg={bento.primarySoft}
          />
          <InfoTile
            icon="link-variant"
            label="Liên kết"
            value={notification.relatedId || "Không có"}
            color={bento.route}
            bg={bento.routeSoft}
          />
        </View>

        <View style={styles.actions}>
          {relatedTab ? (
            <Pressable
              onPress={() => onOpenTab(relatedTab)}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryActionText}>
                Mở nội dung liên quan
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#fff"
              />
            </Pressable>
          ) : null}
          {!notification.isRead ? (
            <Pressable
              onPress={() => onMarkRead(notification._id)}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={19}
                color={bento.primary}
              />
              <Text style={styles.secondaryActionText}>Đánh dấu đã đọc</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function InfoTile({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: IconName;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  const border = borderForBg(bg);
  return (
    <View
      style={[
        styles.infoTile,
        { backgroundColor: bento.surface, borderColor: border },
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: color, borderColor: color },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function tabForNotification(notification: Notification): SellerTab | undefined {
  if (!notification.relatedId) return undefined;
  if (notification.type === "order") return "orders";
  if (notification.type === "route") return "routes";
  if (notification.type === "visit") return "visits";
  if (notification.type === "leave") return "leaves";
  return undefined;
}

function notificationTone(type: Notification["type"]): {
  icon: IconName;
  color: string;
  bg: string;
  border: string;
} {
  if (type === "order")
    return {
      icon: "cart-outline",
      color: "#059669",
      bg: "#ECFDF5",
      border: "#A7F3D0",
    };
  if (type === "route")
    return {
      icon: "map-marker-path",
      color: "#2563EB",
      bg: "#EFF6FF",
      border: "#BFDBFE",
    };
  if (type === "visit")
    return {
      icon: "map-marker-check-outline",
      color: "#0891B2",
      bg: "#ECFEFF",
      border: "#A5F3FC",
    };
  if (type === "leave")
    return {
      icon: "calendar-clock",
      color: "#D97706",
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  if (type === "inventory")
    return {
      icon: "package-variant-closed",
      color: "#64748B",
      bg: "#F8FAFC",
      border: "#CBD5E1",
    };
  if (type === "promotion")
    return {
      icon: "ticket-percent-outline",
      color: "#6D28D9",
      bg: "#F5F3FF",
      border: "#DDD6FE",
    };
  return {
    icon: "bell-outline",
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
  };
}

function borderForBg(bg: string) {
  if (bg === bento.primarySoft) return bento.borderStrong;
  if (bg === bento.routeSoft) return "#BAE6FD";
  if (bg === bento.successSoft) return bento.borderStrong;
  if (bg === bento.warningSoft) return "#FED7AA";
  if (bg === bento.dangerSoft) return "#FECACA";
  if (bg === bento.infoSoft) return bento.borderStrong;
  if (bg === bento.routeSoft) return bento.borderStrong;
  if (bg === "#F5F3FF") return "#DDD6FE";
  if (bg === "#EFF6FF") return "#BFDBFE";
  if (bg === "#ECFEFF") return "#A5F3FC";
  if (bg === "#ECFDF5") return "#A7F3D0";
  if (bg === "#FFFBEB") return "#FDE68A";
  if (bg === "#FEF2F2") return "#FECACA";
  if (bg === "#F8FAFC") return "#CBD5E1";
  if (bg === "#F0FDFA") return "#99F6E4";
  return bento.border;
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
    marginHorizontal: -20,
    marginTop: -18,
    minHeight: 70,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  statusPill: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillNew: { backgroundColor: bento.dangerSoft, borderColor: "#FECACA" },
  statusText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  statusTextNew: { color: bento.danger },
  hero: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 9,
    padding: 18,
    ...bentoSoftShadow,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  typeLabel: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  notificationTitle: {
    color: bento.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  timeText: { color: bento.textSecondary, fontSize: 12, fontWeight: "600" },
  contentCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 9,
    padding: 16,
    ...bentoSoftShadow,
  },
  sectionLabel: { color: bento.text, fontSize: 14, fontWeight: "700" },
  message: {
    color: bento.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  infoGrid: { gap: 10 },
  infoTile: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 68,
    padding: 12,
    ...bentoSoftShadow,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  infoText: { flex: 1, minWidth: 0 },
  infoLabel: { color: bento.textMuted, fontSize: 11, fontWeight: "600" },
  infoValue: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  actions: { gap: 10 },
  primaryAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    height: 54,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryActionText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    color: bento.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: { opacity: 0.72 },
});
