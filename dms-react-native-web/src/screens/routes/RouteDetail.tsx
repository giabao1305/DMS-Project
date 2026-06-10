import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner, SuccessBanner, Timeline, TimelineItem } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { AuthUser, RoutePlan, RouteStatus } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import {
  getCustomerId,
  getCustomerName,
  shortDate,
  shortDateTime,
  statusLabel,
} from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "blue"
  | "routeAlt"
  | "violet"
  | "muted";

type VisitCreateIntent = {
  routeId?: string;
  customerId?: string;
};

export function RouteDetail({
  route,
  user,
  onBack,
  onCreateVisit,
  onChanged,
}: {
  route: RoutePlan;
  user: AuthUser;
  onBack: () => void;
  onCreateVisit: (intent: VisitCreateIntent) => void;
  onChanged: (route: RoutePlan) => void;
}) {
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const progress = routeProgress(route);
  const tone = statusTone(route.status);
  const routeCustomers = sortRouteCustomers(route.customers);
  const substitute = isSubstituteRoute(route, user);
  const nextAction = getRouteAction(route.status, progress.done, progress.total);

  const changeRouteStatus = async (status: RouteStatus) => {
    setSubmittingStatus(true);
    setError("");
    setMessage("");
    try {
      const updated = await sellerApi.updateRouteStatus(route._id, status);
      onChanged(updated);
      setMessage(
        status === "in_progress"
          ? "Đã bắt đầu tuyến bán hàng."
          : "Đã hoàn tất tuyến bán hàng.",
      );
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không cập nhật được trạng thái tuyến",
        ),
      );
    } finally {
      setSubmittingStatus(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Chi tiết tuyến</Text>
            <Text style={styles.title}>Tuyến bán</Text>
          </View>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: tone.text, borderColor: tone.text },
            ]}
          >
            <MaterialCommunityIcons
              name="map-marker-path"
              size={21}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: bento.surface,
              borderColor: tone.border,
              borderLeftColor: tone.text,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>Tuyến hôm nay</Text>
              <Text style={styles.routeName} numberOfLines={2}>
                {route.name}
              </Text>
              <Text style={styles.routeDate}>
                {shortDate(route.workDate)}
                {substitute ? " · Đi thay" : ""}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: bento.surface, borderColor: tone.border },
              ]}
            >
              <Text style={[styles.statusText, { color: tone.text }]}>
                {statusLabel(route.status)}
              </Text>
            </View>
          </View>
          <View style={styles.heroProgressLine}>
            <View>
              <Text style={styles.heroProgressValue}>
                {progress.done}/{progress.total}
              </Text>
              <Text style={styles.heroProgressLabel}>điểm đã xử lý</Text>
            </View>
            <Text style={styles.heroPercent}>{progress.percent}%</Text>
          </View>
          <View style={styles.progressTrackDark}>
            <View
              style={[
                styles.progressFillDark,
                { width: `${progress.percent}%` },
              ]}
            />
          </View>
          {nextAction ? (
            <Pressable
              onPress={() => changeRouteStatus(nextAction.status)}
              disabled={submittingStatus || nextAction.disabled}
              style={({ pressed }) => [
                styles.routeActionButton,
                nextAction.disabled && styles.routeActionButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name={nextAction.icon}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.routeActionText}>
                {submittingStatus ? "Đang cập nhật..." : nextAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ErrorBanner message={error} />
        <SuccessBanner message={message} />

        <View style={styles.infoGrid}>
          <InfoTile
            icon="store-marker-outline"
            label="Điểm bán"
            value={`${route.customers.length}`}
            tone="violet"
          />
          <InfoTile
            icon="map-marker-check-outline"
            label="Hoàn tất"
            value={`${progress.done}/${progress.total}`}
            tone="success"
          />
          <InfoTile
            icon="calendar-outline"
            label="Ngày"
            value={shortDate(route.workDate)}
            tone="primary"
          />
          <InfoTile
            icon="clock-outline"
            label="Cập nhật"
            value={shortDateTime(route.updatedAt)}
            tone="muted"
          />
        </View>

        <View style={styles.card}>
          <SectionTitle
            icon="storefront-outline"
            title="Điểm bán trong tuyến"
            tone="violet"
          />
          <Timeline>
            {routeCustomers.map((item, index) => {
              const customerId = getCustomerId(item.customer);
              const canCheckIn =
                route.status === "in_progress" &&
                Boolean(customerId) &&
                (item.status === "pending" || !item.status);
              const itemTone = stopTone(item.status || "pending");
              return (
                <TimelineItem
                  key={`${route._id}-${item.orderIndex}-${index}`}
                  icon={stopIcon(item.status)}
                  color={itemTone.text}
                  bg={itemTone.bg}
                  isLast={index === routeCustomers.length - 1}
                >
                  <View
                    style={[
                      styles.stopCard,
                      {
                        backgroundColor: itemTone.bg,
                        borderColor: itemTone.border,
                        borderLeftColor: itemTone.text,
                      },
                    ]}
                  >
                    <View style={styles.stopTop}>
                      <View style={styles.stopIndex}>
                        <Text style={styles.stopIndexText}>
                          {item.orderIndex || index + 1}
                        </Text>
                      </View>
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName} numberOfLines={1}>
                          {getCustomerName(item.customer)}
                        </Text>
                        <Text style={styles.customerNote} numberOfLines={1}>
                          {item.note || statusLabel(item.status || "pending")}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: itemTone.bg,
                            borderColor: itemTone.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: itemTone.text }]}
                        >
                          {statusLabel(item.status || "pending")}
                        </Text>
                      </View>
                    </View>
                    {canCheckIn ? (
                      <Pressable
                        onPress={() =>
                          onCreateVisit({ routeId: route._id, customerId })
                        }
                        style={({ pressed }) => [
                          styles.checkInButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-check"
                          size={15}
                          color="#FFFFFF"
                        />
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
          <SectionTitle
            icon="information-outline"
            title="Thông tin tuyến"
            tone="primary"
          />
          <DetailRow label="Trạng thái" value={statusLabel(route.status)} />
          <DetailRow
            label="Phân công"
            value={substitute ? "Đi thay tuyến" : "Tuyến của tôi"}
          />
          {route.substituteReason ? (
            <DetailRow label="Lý do đi thay" value={route.substituteReason} />
          ) : null}
          <DetailRow label="Tạo lúc" value={shortDateTime(route.createdAt)} />
          <DetailRow label="Cập nhật" value={shortDateTime(route.updatedAt)} />
        </View>
      </View>
    </ScrollView>
  );
}

function isSubstituteRoute(route: RoutePlan, user: AuthUser) {
  return getRelationId(route.substituteSeller) === user._id;
}

function getRelationId(value?: string | { _id: string }) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value._id;
}

function SectionTitle({
  icon,
  title,
  tone,
}: {
  icon: IconName;
  title: string;
  tone: ToneName;
}) {
  const color = toneColors(tone);
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: color.text, borderColor: color.text },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={19} color="#FFFFFF" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: ToneName;
}) {
  const color = toneColors(tone);
  return (
    <View
      style={[
        styles.infoTile,
        { backgroundColor: bento.surface, borderColor: color.border },
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: color.text, borderColor: color.text },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.infoLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function routeProgress(route: RoutePlan) {
  const total = route.customers.length;
  const done = route.customers.filter(
    (item) =>
      item.status === "checked_in" ||
      item.status === "visited" ||
      item.status === "skipped",
  ).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function getRouteAction(status: RouteStatus, done: number, total: number) {
  if (status === "planned") {
    return {
      status: "in_progress" as RouteStatus,
      label: "Bắt đầu tuyến",
      icon: "play-circle-outline" as IconName,
      disabled: false,
    };
  }

  if (status === "in_progress") {
    return {
      status: "completed" as RouteStatus,
      label: total > 0 && done < total ? "Chưa xử lý hết điểm bán" : "Hoàn tất tuyến",
      icon: "check-circle-outline" as IconName,
      disabled: total > 0 && done < total,
    };
  }

  return undefined;
}

function sortRouteCustomers(customers: RoutePlan["customers"]) {
  return [...customers].sort(
    (left, right) =>
      getRouteOrder(left.orderIndex) - getRouteOrder(right.orderIndex),
  );
}

function getRouteOrder(value?: number) {
  return Number.isFinite(value) && value ? value : Number.MAX_SAFE_INTEGER;
}

function statusTone(status?: string) {
  if (status === "completed") return toneColors("success");
  if (status === "in_progress") return toneColors("routeAlt");
  if (status === "cancelled") return toneColors("danger");
  if (status === "planned") return toneColors("blue");
  return toneColors("warning");
}

function stopTone(status?: string) {
  if (status === "checked_in" || status === "visited")
    return toneColors("success");
  if (status === "skipped") return toneColors("warning");
  if (status === "pending") return toneColors("muted");
  return statusTone(status);
}

function stopIcon(status?: string): IconName {
  if (status === "checked_in" || status === "visited")
    return "check-circle-outline";
  if (status === "skipped") return "skip-next-outline";
  return "storefront-outline";
}

function toneColors(tone: ToneName) {
  if (tone === "success")
    return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (tone === "warning")
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  if (tone === "danger")
    return { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (tone === "routeAlt")
    return { text: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" };
  if (tone === "violet")
    return { text: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" };
  if (tone === "primary")
    return {
      text: "#2563EB",
      bg: "#EFF6FF",
      border: "#BFDBFE",
    };
  if (tone === "muted")
    return {
      text: "#64748B",
      bg: "#F8FAFC",
      border: "#CBD5E1",
    };
  return { text: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 760,
    paddingHorizontal: 20,
    paddingTop: 18,
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
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  headerIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  heroCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
    ...bentoSoftShadow,
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroText: { flex: 1, minWidth: 0 },
  heroLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "600" },
  routeName: {
    color: bento.text,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 27,
    marginTop: 4,
  },
  routeDate: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  statusPill: {
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 132,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  heroProgressLine: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroProgressValue: { color: bento.text, fontSize: 28, fontWeight: "700" },
  heroProgressLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  heroPercent: { color: bento.primaryDark, fontSize: 28, fontWeight: "700" },
  progressTrackDark: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    height: 9,
    overflow: "hidden",
  },
  progressFillDark: {
    backgroundColor: bento.primaryDark,
    borderRadius: 8,
    height: "100%",
  },
  routeActionButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: bento.route,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  routeActionButtonDisabled: {
    backgroundColor: bento.textMuted,
  },
  routeActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoTile: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 104,
    padding: 13,
    ...bentoSoftShadow,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  infoValue: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 11,
  },
  infoLabel: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 10 },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  stopCard: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
  },
  stopTop: { alignItems: "center", flexDirection: "row", gap: 9 },
  stopIndex: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  stopIndexText: { color: bento.text, fontSize: 12, fontWeight: "700" },
  customerInfo: { flex: 1, minWidth: 0 },
  customerName: { color: bento.text, fontSize: 14, fontWeight: "700" },
  customerNote: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  checkInButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: bento.route,
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  checkInText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  detailRow: {
    alignItems: "flex-start",
    borderTopColor: bento.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 11,
  },
  detailLabel: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  detailValue: {
    color: bento.text,
    flex: 1.3,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "right",
  },
  pressed: { opacity: 0.72 },
});
