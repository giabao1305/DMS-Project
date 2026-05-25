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
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>NOTIFICATION DETAIL</Text>
            <Text style={styles.title}>Chi tiết thông báo</Text>
          </View>
          <View style={[styles.statusPill, !notification.isRead && styles.statusPillNew]}>
            <Text style={[styles.statusText, !notification.isRead && styles.statusTextNew]}>{notification.isRead ? "Đã đọc" : "Mới"}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: tone.bg }]}>
            <MaterialCommunityIcons name={tone.icon} size={29} color={tone.color} />
          </View>
          <Text style={styles.typeLabel}>{typeLabel(notification.type)}</Text>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.timeText}>{shortDateTime(notification.createdAt)}</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.sectionLabel}>Nội dung</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile icon="tag-outline" label="Loại" value={typeLabel(notification.type)} color={tone.color} bg={tone.bg} />
          <InfoTile icon="clock-outline" label="Tạo lúc" value={shortDateTime(notification.createdAt)} color={bento.primary} bg={bento.primarySoft} />
          <InfoTile icon="link-variant" label="Liên kết" value={notification.relatedId || "Không có"} color={bento.route} bg={bento.routeSoft} />
        </View>

        <View style={styles.actions}>
          {relatedTab ? (
            <Pressable onPress={() => onOpenTab(relatedTab)} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
              <Text style={styles.primaryActionText}>Mở nội dung liên quan</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </Pressable>
          ) : null}
          {!notification.isRead ? (
            <Pressable onPress={() => onMarkRead(notification._id)} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="check-circle-outline" size={19} color={bento.primary} />
              <Text style={styles.secondaryActionText}>Đánh dấu đã đọc</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function InfoTile({ icon, label, value, color, bg }: { icon: IconName; label: string; value: string; color: string; bg: string }) {
  return (
    <View style={styles.infoTile}>
      <View style={[styles.infoIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
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
  if (notification.type === "promotion" || notification.type === "inventory") return "orders";
  return undefined;
}

function notificationTone(type: Notification["type"]): { icon: IconName; color: string; bg: string } {
  if (type === "order") return { icon: "cart-outline", color: bento.success, bg: bento.successSoft };
  if (type === "route") return { icon: "map-marker-path", color: bento.primary, bg: bento.primarySoft };
  if (type === "visit") return { icon: "map-marker-check-outline", color: bento.primary, bg: bento.primarySoft };
  if (type === "leave") return { icon: "calendar-clock", color: bento.warning, bg: bento.warningSoft };
  if (type === "inventory") return { icon: "package-variant-closed", color: bento.textSecondary, bg: bento.surfaceAlt };
  if (type === "promotion") return { icon: "ticket-percent-outline", color: bento.route, bg: bento.routeSoft };
  return { icon: "bell-outline", color: bento.info, bg: bento.infoSoft };
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
  page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  backButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  title: { color: bento.text, fontSize: 23, fontWeight: "900", marginTop: 2 },
  statusPill: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  statusPillNew: { backgroundColor: bento.dangerSoft, borderColor: "#FECACA" },
  statusText: { color: bento.textSecondary, fontSize: 12, fontWeight: "900" },
  statusTextNew: { color: bento.danger },
  hero: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, gap: 9, padding: 18, ...bentoSoftShadow },
  heroIcon: { alignItems: "center", borderRadius: 17, height: 56, justifyContent: "center", width: 56 },
  typeLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "900", marginTop: 4, textTransform: "uppercase" },
  notificationTitle: { color: bento.text, fontSize: 22, fontWeight: "900", lineHeight: 28 },
  timeText: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  contentCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, gap: 9, padding: 16, ...bentoSoftShadow },
  sectionLabel: { color: bento.text, fontSize: 14, fontWeight: "900" },
  message: { color: bento.textSecondary, fontSize: 14, fontWeight: "700", lineHeight: 22 },
  infoGrid: { gap: 10 },
  infoTile: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 68, padding: 12, ...bentoSoftShadow },
  infoIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  infoText: { flex: 1, minWidth: 0 },
  infoLabel: { color: bento.textMuted, fontSize: 11, fontWeight: "800" },
  infoValue: { color: bento.text, fontSize: 13, fontWeight: "900", lineHeight: 18, marginTop: 3 },
  actions: { gap: 10 },
  primaryAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 15, flexDirection: "row", gap: 8, height: 54, justifyContent: "center", paddingHorizontal: 16 },
  primaryActionText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  secondaryAction: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 8, height: 52, justifyContent: "center", paddingHorizontal: 16 },
  secondaryActionText: { color: bento.primary, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
