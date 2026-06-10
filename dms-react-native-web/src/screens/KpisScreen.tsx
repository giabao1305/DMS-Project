import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { EmptyState, ErrorBanner, LoadingState } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoShadow, bentoSoftShadow } from "../theme";
import type { Kpi } from "../types/domain";
import { currency } from "../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const metricPalette = {
  primary: { color: "#2563EB", bg: "#EFF6FF" },
  route: { color: "#0891B2", bg: "#ECFEFF" },
  success: { color: "#059669", bg: "#ECFDF5" },
  warning: { color: "#D97706", bg: "#FFFBEB" },
};

export function KpisScreen({
  onOpenTab,
}: {
  onOpenTab: (tab: SellerTab) => void;
}) {
  const { data, loading, error, reload } = useResource(sellerApi.kpis, []);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useRegisterRefresh(reload, [reload]);

  const kpis = data || [];
  const current = useMemo(
    () => kpis.find((item) => item.month === month && item.year === year),
    [kpis, month, year],
  );
  const best = useMemo(
    () =>
      [...kpis].sort(
        (a, b) => (b.performanceRate || 0) - (a.performanceRate || 0),
      )[0],
    [kpis],
  );
  const averageScore = kpis.length
    ? Math.round(
        kpis.reduce((sum, item) => sum + (item.performanceRate || 0), 0) /
          kpis.length,
      )
    : 0;

  if (loading) return <LoadingState />;

  const performance = Math.round(current?.performanceRate || 0);
  const review =
    performance >= 100
      ? "Vượt mục tiêu"
      : performance >= 70
        ? "Đang tốt"
        : "Cần bứt tốc";
  const reviewTone =
    performance >= 100
      ? metricPalette.success.color
      : performance >= 70
        ? metricPalette.primary.color
        : metricPalette.warning.color;
  const revenuePercent = current
    ? ratio(current.actualRevenue, current.targetRevenue)
    : 0;

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
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={bento.text}
            />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Báo cáo doanh số</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={22}
              color="#FFFFFF"
            />
          </View>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.selectorCard}>
          <Stepper
            label="Tháng"
            value={month}
            onMinus={() => setMonth((value) => (value === 1 ? 12 : value - 1))}
            onPlus={() => setMonth((value) => (value === 12 ? 1 : value + 1))}
          />
          <Stepper
            label="Năm"
            value={year}
            onMinus={() => setYear((value) => value - 1)}
            onPlus={() => setYear((value) => value + 1)}
          />
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            icon="chart-timeline-variant"
            label="Trung bình"
            value={`${averageScore}%`}
            color={metricPalette.primary.color}
            bg={metricPalette.primary.bg}
          />
          <SummaryCard
            icon="trophy-outline"
            label="Kỳ tốt nhất"
            value={best ? `${Math.round(best.performanceRate || 0)}%` : "-"}
            hint={best ? `${best.month}/${best.year}` : "Chưa có"}
            color={metricPalette.warning.color}
            bg={metricPalette.warning.bg}
          />
        </View>

        {!current ? (
          <EmptyState
            title="Chưa có KPI"
            message="Quản trị viên chưa thiết lập KPI cho tháng đang chọn."
          />
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>
                    Doanh số tháng {current.month}/{current.year}
                  </Text>
                  <Text style={styles.heroValue}>
                    {currency(current.actualRevenue)}
                  </Text>
                </View>
                <View
                  style={[styles.reviewBadge, { backgroundColor: reviewTone }]}
                >
                  <Text style={styles.reviewText}>{review}</Text>
                </View>
              </View>
              <View style={styles.heroDelta}>
                <MaterialCommunityIcons
                  name={performance >= 70 ? "trending-up" : "trending-down"}
                  size={17}
                  color={reviewTone}
                />
                <Text style={[styles.heroDeltaText, { color: reviewTone }]}>
                  {performance}% KPI tổng
                </Text>
                <Text style={styles.heroDeltaMuted}>
                  Mục tiêu {currency(current.targetRevenue)}
                </Text>
              </View>
              <View style={styles.heroProgress}>
                <View style={styles.heroProgressLabels}>
                  <Text style={styles.heroProgressLabel}>
                    Tiến độ doanh thu
                  </Text>
                  <Text style={styles.heroProgressValue}>
                    {Math.round(revenuePercent)}%
                  </Text>
                </View>
                <View style={styles.heroTrack}>
                  <View
                    style={[
                      styles.heroFill,
                      {
                        width: `${Math.min(Math.max(revenuePercent, 0), 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <KpiCard
                icon="cash-multiple"
                label="Doanh thu"
                actual={currency(current.actualRevenue)}
                target={currency(current.targetRevenue)}
                percent={revenuePercent}
                color={metricPalette.success.color}
                bg={metricPalette.success.bg}
              />
              <KpiCard
                icon="cart-check"
                label="Đơn hàng"
                actual={`${current.actualOrders}`}
                target={`${current.targetOrders} đơn`}
                percent={ratio(current.actualOrders, current.targetOrders)}
                color={metricPalette.primary.color}
                bg={metricPalette.primary.bg}
              />
              <KpiCard
                icon="map-marker-check-outline"
                label="Ghé thăm"
                actual={`${current.actualVisits}`}
                target={`${current.targetVisits} lượt`}
                percent={ratio(current.actualVisits, current.targetVisits)}
                color={metricPalette.route.color}
                bg={metricPalette.route.bg}
              />
            </View>

            <View style={styles.actionRow}>
              <QuickAction
                icon="cart-plus"
                label="Tạo đơn"
                color={metricPalette.warning.color}
                bg={metricPalette.warning.bg}
                onPress={() => onOpenTab("orders")}
              />
              <QuickAction
                icon="map-marker-path"
                label="Đi tuyến"
                color={metricPalette.route.color}
                bg={metricPalette.route.bg}
                onPress={() => onOpenTab("routes")}
              />
              <QuickAction
                icon="store-check-outline"
                label="Ghé thăm"
                color={metricPalette.success.color}
                bg={metricPalette.success.bg}
                onPress={() => onOpenTab("visits")}
              />
            </View>

            <View style={styles.historyCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Lịch sử hiệu suất</Text>
                  <Text style={styles.sectionHint}>
                    {kpis.length} kỳ đã ghi nhận
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={21}
                  color={bento.textMuted}
                />
              </View>
              <View style={styles.historyList}>
                {kpis.map((item) => (
                  <HistoryRow
                    key={item._id}
                    item={item}
                    selected={item.month === month && item.year === year}
                    onPress={() => {
                      setMonth(item.month);
                      setYear(item.year);
                    }}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  color,
  bg,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      style={[styles.summaryCard, { borderColor: bg, borderLeftColor: color }]}
    >
      <View style={[styles.summaryIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={19} color="#FFFFFF" />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
        {hint ? <Text style={styles.summaryHint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <Pressable
          onPress={onMinus}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="minus" size={16} color={bento.text} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          onPress={onPlus}
          style={({ pressed }) => [
            styles.stepperButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={16} color={bento.text} />
        </Pressable>
      </View>
    </View>
  );
}

function KpiCard({
  icon,
  label,
  actual,
  target,
  percent,
  color,
  bg,
}: {
  icon: IconName;
  label: string;
  actual: string;
  target: string;
  percent: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.kpiCard, { borderColor: bg, borderLeftColor: color }]}>
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={21} color="#FFFFFF" />
        </View>
        <Text style={[styles.kpiPercent, { color }]}>
          {Math.round(percent)}%
        </Text>
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiActual} numberOfLines={1}>
        {actual}
      </Text>
      <Text style={styles.kpiTarget} numberOfLines={1}>
        Mục tiêu {target}
      </Text>
      <ProgressBar percent={percent} color={color} compact />
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: IconName;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        { borderColor: bg, borderLeftColor: color },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  );
}

function HistoryRow({
  item,
  selected,
  onPress,
}: {
  item: Kpi;
  selected: boolean;
  onPress: () => void;
}) {
  const score = Math.round(item.performanceRate || 0);
  const color =
    score >= 100
      ? metricPalette.success.color
      : score >= 70
        ? metricPalette.primary.color
        : metricPalette.warning.color;
  const bg =
    score >= 100
      ? metricPalette.success.bg
      : score >= 70
        ? metricPalette.primary.bg
        : metricPalette.warning.bg;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyRow,
        { borderLeftColor: color },
        selected && styles.historyRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.historyIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons
          name="chart-timeline-variant"
          size={18}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.historyText}>
        <Text style={styles.historyTitle}>
          Tháng {item.month}/{item.year}
        </Text>
        <Text style={styles.historyMeta} numberOfLines={1}>
          {currency(item.actualRevenue)} - {item.actualOrders} đơn -{" "}
          {item.actualVisits} lượt ghé
        </Text>
      </View>
      <Text style={[styles.historyScore, { color, backgroundColor: bg }]}>
        {score}%
      </Text>
    </Pressable>
  );
}

function ProgressBar({
  percent,
  color,
  compact,
}: {
  percent: number;
  color: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.barTrack, compact && styles.barTrackCompact]}>
      <View
        style={[
          styles.barFill,
          compact && styles.barFillCompact,
          {
            backgroundColor: color,
            width: `${Math.min(Math.max(percent, 0), 100)}%`,
          },
        ]}
      />
    </View>
  );
}

function ratio(actual: number, target: number) {
  if (!target || target <= 0) return 0;
  return (actual / target) * 100;
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
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  backButton: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...bentoSoftShadow,
  },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "700" },
  title: { color: bento.text, fontSize: 22, fontWeight: "700", marginTop: 2 },
  headerIcon: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderColor: bento.primary,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  selectorCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    ...bentoSoftShadow,
  },
  stepper: { flex: 1, gap: 8, minWidth: 0 },
  stepperLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  stepperControl: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
  },
  stepperButton: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  stepperValue: { color: bento.text, fontSize: 16, fontWeight: "700" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 82,
    minWidth: 160,
    padding: 12,
    ...bentoSoftShadow,
  },
  summaryIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  summaryText: { flex: 1, minWidth: 0 },
  summaryLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "700" },
  summaryValue: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryHint: {
    color: bento.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  hero: {
    backgroundColor: bento.primary,
    borderRadius: 8,
    gap: 14,
    overflow: "hidden",
    padding: 18,
    ...bentoShadow,
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "600",
  },
  heroValue: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 5 },
  reviewBadge: { borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  reviewText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heroDelta: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  heroDeltaText: { fontSize: 13, fontWeight: "700" },
  heroDeltaMuted: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    fontWeight: "600",
  },
  heroProgress: { gap: 8, paddingTop: 4 },
  heroProgressLabels: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroProgressLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "600",
  },
  heroProgressValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  heroTrack: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    height: 9,
    overflow: "hidden",
  },
  heroFill: { backgroundColor: "#FFFFFF", borderRadius: 8, height: 9 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 128,
    flexGrow: 1,
    gap: 7,
    minWidth: 128,
    padding: 14,
    ...bentoSoftShadow,
  },
  kpiTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kpiIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  kpiPercent: { fontSize: 13, fontWeight: "700" },
  kpiLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  kpiActual: { color: bento.text, fontSize: 20, fontWeight: "700" },
  kpiTarget: { color: bento.textMuted, fontSize: 11, fontWeight: "700" },
  barTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    height: 12,
    overflow: "hidden",
  },
  barTrackCompact: { height: 8 },
  barFill: { borderRadius: 8, height: 12 },
  barFillCompact: { height: 8 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickAction: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "30%",
    flexGrow: 1,
    gap: 8,
    minHeight: 82,
    minWidth: 150,
    padding: 12,
    ...bentoSoftShadow,
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quickText: {
    color: bento.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  historyCard: {
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
  historyList: { gap: 9 },
  historyRow: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 66,
    padding: 10,
  },
  historyRowSelected: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  historyIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  historyText: { flex: 1, minWidth: 0 },
  historyTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  historyMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  historyScore: {
    borderRadius: 8,
    fontSize: 13,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pressed: { opacity: 0.72 },
});
