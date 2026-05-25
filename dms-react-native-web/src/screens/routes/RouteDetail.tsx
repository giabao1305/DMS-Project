import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ErrorBanner, SuccessBanner, Timeline, TimelineItem } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { RoutePlan } from "../../types/domain";
import { getCustomerId, getCustomerName, shortDate, shortDateTime, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

type VisitCreateIntent = {
  routeId?: string;
  customerId?: string;
};

export function RouteDetail({
  route,
  onBack,
  onCreateVisit,
  onUpdateStatus,
  actionError,
  actionMessage,
  updating,
}: {
  route: RoutePlan;
  onBack: () => void;
  onCreateVisit: (intent: VisitCreateIntent) => void;
  onUpdateStatus: (route: RoutePlan, status: "in_progress" | "completed") => Promise<void>;
  actionError?: string;
  actionMessage?: string;
  updating?: boolean;
}) {
  const progress = routeProgress(route);
  const tone = statusTone(route.status);
  const confirmUpdate = (status: "in_progress" | "completed") => {
    const title = status === "in_progress" ? "Bắt đầu tuyến" : "Hoàn thành tuyến";
    const message = status === "in_progress" ? `Bắt đầu tuyến ${route.name}?` : `Xác nhận hoàn thành tuyến ${route.name}?`;
    Alert.alert(title, message, [
      { text: "Hủy", style: "cancel" },
      { text: "Xác nhận", onPress: () => { void onUpdateStatus(route, status); } },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Chi tiết tuyến</Text>
            <Text style={styles.title}>Tuyến bán</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            <MaterialCommunityIcons name="map-marker-path" size={21} color={tone.text} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>Tuyến hôm nay</Text>
              <Text style={styles.routeName} numberOfLines={2}>{route.name}</Text>
              <Text style={styles.routeDate}>{shortDate(route.workDate)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(route.status)}</Text>
            </View>
          </View>
          <View style={styles.heroProgressLine}>
            <View>
              <Text style={styles.heroProgressValue}>{progress.done}/{progress.total}</Text>
              <Text style={styles.heroProgressLabel}>điểm đã xử lý</Text>
            </View>
            <Text style={styles.heroPercent}>{progress.percent}%</Text>
          </View>
          <View style={styles.progressTrackDark}>
            <View style={[styles.progressFillDark, { width: `${progress.percent}%` }]} />
          </View>
        </View>

        <ErrorBanner message={actionError} />
        <SuccessBanner message={actionMessage} />

        <View style={styles.infoGrid}>
          <InfoTile icon="store-marker-outline" label="Điểm bán" value={`${route.customers.length}`} tone="blue" />
          <InfoTile icon="map-marker-check-outline" label="Hoàn tất" value={`${progress.done}/${progress.total}`} tone="success" />
          <InfoTile icon="calendar-outline" label="Ngày" value={shortDate(route.workDate)} tone="primary" />
          <InfoTile icon="clock-outline" label="Cập nhật" value={shortDateTime(route.updatedAt)} tone="muted" />
        </View>

        <View style={styles.card}>
          <SectionTitle icon="storefront-outline" title="Điểm bán trong tuyến" tone="blue" />
          <Timeline>
            {route.customers.map((item, index) => {
              const customerId = getCustomerId(item.customer);
              const canCheckIn = Boolean(customerId) && (item.status === "pending" || !item.status);
              const itemTone = stopTone(item.status || "pending");
              return (
                <TimelineItem key={`${route._id}-${item.orderIndex}-${index}`} icon={stopIcon(item.status)} color={itemTone.text} bg={itemTone.bg} isLast={index === route.customers.length - 1}>
                  <View style={styles.stopCard}>
                    <View style={styles.stopTop}>
                      <View style={styles.stopIndex}><Text style={styles.stopIndexText}>{item.orderIndex || index + 1}</Text></View>
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName} numberOfLines={1}>{getCustomerName(item.customer)}</Text>
                        <Text style={styles.customerNote} numberOfLines={1}>{item.note || statusLabel(item.status || "pending")}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: itemTone.bg, borderColor: itemTone.border }]}>
                        <Text style={[styles.statusText, { color: itemTone.text }]}>{statusLabel(item.status || "pending")}</Text>
                      </View>
                    </View>
                    {canCheckIn ? (
                      <Pressable onPress={() => onCreateVisit({ routeId: route._id, customerId })} style={({ pressed }) => [styles.checkInButton, pressed && styles.pressed]}>
                        <MaterialCommunityIcons name="map-marker-check" size={15} color="#FFFFFF" />
                        <Text style={styles.checkInText}>Check-in ngay</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </TimelineItem>
              );
            })}
          </Timeline>
        </View>

        <View style={styles.card}>
          <SectionTitle icon="information-outline" title="Thông tin tuyến" tone="primary" />
          <DetailRow label="Trạng thái" value={statusLabel(route.status)} />
          <DetailRow label="Tạo lúc" value={shortDateTime(route.createdAt)} />
          <DetailRow label="Cập nhật" value={shortDateTime(route.updatedAt)} />
        </View>

        {route.status === "planned" || route.status === "in_progress" ? (
          <View style={styles.actions}>
            {route.status === "planned" ? (
              <RouteAction label="Bắt đầu tuyến" onPress={() => confirmUpdate("in_progress")} icon="play" variant="muted" loading={updating} />
            ) : null}
            {route.status === "in_progress" ? (
              <RouteAction label="Hoàn thành tuyến" onPress={() => confirmUpdate("completed")} icon="check" loading={updating} />
            ) : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ icon, title, tone }: { icon: IconName; title: string; tone: ToneName }) {
  const color = toneColors(tone);
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={19} color={color.text} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoTile({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone: ToneName }) {
  const color = toneColors(tone);
  return <View style={styles.infoTile}><View style={[styles.infoIcon, { backgroundColor: color.bg, borderColor: color.border }]}><MaterialCommunityIcons name={icon} size={18} color={color.text} /></View><Text style={styles.infoValue} numberOfLines={1}>{value}</Text><Text style={styles.infoLabel} numberOfLines={1}>{label}</Text></View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue} numberOfLines={2}>{value}</Text></View>;
}

function RouteAction({ label, icon, onPress, loading, variant = "primary" }: { label: string; icon: IconName; onPress: () => void; loading?: boolean; variant?: "primary" | "muted" }) {
  const muted = variant === "muted";
  return (
    <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.routeAction, muted && styles.routeActionMuted, pressed && styles.pressed, loading && styles.disabled]}>
      {loading ? <ActivityIndicator size="small" color={muted ? bento.primaryDark : "#FFFFFF"} /> : <MaterialCommunityIcons name={icon} size={17} color={muted ? bento.primaryDark : "#FFFFFF"} />}
      <Text style={[styles.routeActionText, muted && styles.routeActionTextMuted]}>{loading ? "Đang cập nhật..." : label}</Text>
    </Pressable>
  );
}

function routeProgress(route: RoutePlan) {
  const total = route.customers.length;
  const done = route.customers.filter((item) => item.status === "checked_in" || item.status === "visited" || item.status === "skipped").length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function statusTone(status?: string) {
  if (status === "completed") return toneColors("success");
  if (status === "in_progress") return toneColors("primary");
  if (status === "cancelled") return toneColors("danger");
  if (status === "planned") return toneColors("blue");
  return toneColors("warning");
}

function stopTone(status?: string) {
  if (status === "checked_in" || status === "visited") return toneColors("success");
  if (status === "skipped") return toneColors("warning");
  if (status === "pending") return toneColors("muted");
  return statusTone(status);
}

function stopIcon(status?: string): IconName {
  if (status === "checked_in" || status === "visited") return "check-circle-outline";
  if (status === "skipped") return "skip-next-outline";
  return "storefront-outline";
}

function toneColors(tone: ToneName) {
  if (tone === "success") return { text: bento.success, bg: bento.successSoft, border: "#BDEEDB" };
  if (tone === "warning") return { text: bento.warning, bg: bento.warningSoft, border: "#FFE0A8" };
  if (tone === "danger") return { text: bento.danger, bg: bento.dangerSoft, border: "#FFCACA" };
  if (tone === "primary") return { text: bento.primaryDark, bg: bento.primarySoft, border: bento.borderStrong };
  if (tone === "muted") return { text: bento.textSecondary, bg: bento.surfaceAlt, border: bento.border };
  return { text: bento.route, bg: bento.routeSoft, border: "#CFE0FF" };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: { alignSelf: "center", gap: 16, maxWidth: 760, paddingHorizontal: 20, paddingTop: 18, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  backButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "800" },
  title: { color: bento.text, fontSize: 24, fontWeight: "900", marginTop: 2 },
  headerIcon: { alignItems: "center", borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  heroCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, gap: 16, padding: 16, ...bentoSoftShadow },
  heroTop: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  heroText: { flex: 1, minWidth: 0 },
  heroLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  routeName: { color: bento.text, fontSize: 21, fontWeight: "900", lineHeight: 27, marginTop: 4 },
  routeDate: { color: bento.textSecondary, fontSize: 12, fontWeight: "800", marginTop: 5 },
  statusPill: { borderRadius: 999, borderWidth: 1, maxWidth: 132, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: "900" },
  heroProgressLine: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  heroProgressValue: { color: bento.text, fontSize: 28, fontWeight: "900" },
  heroProgressLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  heroPercent: { color: bento.primaryDark, fontSize: 28, fontWeight: "900" },
  progressTrackDark: { backgroundColor: bento.surfaceAlt, borderRadius: 999, height: 9, overflow: "hidden" },
  progressFillDark: { backgroundColor: bento.primaryDark, borderRadius: 999, height: "100%" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoTile: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 20, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 104, padding: 13, ...bentoSoftShadow },
  infoIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  infoValue: { color: bento.text, fontSize: 14, fontWeight: "900", marginTop: 11 },
  infoLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "800", marginTop: 3 },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 10 },
  sectionIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  stopCard: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 18, borderWidth: 1, gap: 10, padding: 11 },
  stopTop: { alignItems: "center", flexDirection: "row", gap: 9 },
  stopIndex: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 12, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  stopIndexText: { color: bento.text, fontSize: 12, fontWeight: "900" },
  customerInfo: { flex: 1, minWidth: 0 },
  customerName: { color: bento.text, fontSize: 14, fontWeight: "900" },
  customerNote: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 },
  checkInButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: bento.primary, borderRadius: 999, flexDirection: "row", gap: 6, minHeight: 36, paddingHorizontal: 12 },
  checkInText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  detailRow: { alignItems: "flex-start", borderTopColor: bento.border, borderTopWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingTop: 11 },
  detailLabel: { color: bento.textSecondary, flex: 1, fontSize: 12, fontWeight: "800" },
  detailValue: { color: bento.text, flex: 1.3, fontSize: 13, fontWeight: "900", lineHeight: 18, textAlign: "right" },
  actions: { gap: 10 },
  routeAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 16, flexDirection: "row", gap: 7, height: 52, justifyContent: "center", paddingHorizontal: 15, ...bentoSoftShadow },
  routeActionMuted: { backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderWidth: 1 },
  routeActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  routeActionTextMuted: { color: bento.primaryDark },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});
