import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  MockupHeader,
} from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoSoftShadow } from "../theme";
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
  const history = useMemo(
    () => [...kpis].sort((a, b) => b.year - a.year || b.month - a.month),
    [kpis],
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
  const revenuePercent = current
    ? ratio(current.actualRevenue, current.targetRevenue)
    : 0;
  const orderPercent = current
    ? ratio(current.actualOrders, current.targetOrders)
    : 0;
  const visitPercent = current
    ? ratio(current.actualVisits, current.targetVisits)
    : 0;
  const review = reviewLabel(performance);
  const reviewTone = scoreColor(performance);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.page}>
        <MockupHeader
          title="KPI / Chỉ tiêu"
          subtitle={`Tháng ${month}/${year}`}
          onBack={() => onOpenTab("more")}
          action={
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons
                name="chart-box-outline"
                size={22}
                color="#FFFFFF"
              />
            </View>
          }
        />

        <ErrorBanner message={error} />

        <View style={styles.periodCard}>
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

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="chart-donut"
            label="KPI tháng"
            value={current ? `${performance}%` : "-"}
            color={scoreColor(performance).text}
          />
          <SummaryCard
            icon="cash-multiple"
            label="Doanh thu"
            value={current ? currency(current.actualRevenue) : "-"}
            color={metricPalette.success.color}
          />
          <SummaryCard
            icon="cart-check"
            label="Đơn"
            value={current ? current.actualOrders : "-"}
            color={metricPalette.primary.color}
          />
          <SummaryCard
            icon="map-marker-check-outline"
            label="Ghé"
            value={current ? current.actualVisits : "-"}
            color={metricPalette.route.color}
          />
        </View>

        {!current ? (
          <EmptyState
            title="Chưa có KPI"
            message="Quản trị viên chưa thiết lập KPI cho tháng đang chọn."
            icon="chart-box-outline"
          />
        ) : (
          <>
            <View style={styles.focusCard}>
              <View style={styles.focusTop}>
                <View style={styles.focusCopy}>
                  <Text style={styles.focusLabel}>Tiến độ tổng</Text>
                  <Text style={styles.focusValue}>{performance}%</Text>
                </View>
                <View
                  style={[
                    styles.reviewBadge,
                    {
                      backgroundColor: reviewTone.bg,
                      borderColor: reviewTone.border,
                    },
                  ]}
                >
                  <Text style={[styles.reviewText, { color: reviewTone.text }]}>
                    {review}
                  </Text>
                </View>
              </View>

              <View style={styles.progressList}>
                <ProgressRow
                  icon="cash-multiple"
                  label="Doanh thu"
                  actual={currency(current.actualRevenue)}
                  target={currency(current.targetRevenue)}
                  percent={revenuePercent}
                  color={metricPalette.success.color}
                />
                <ProgressRow
                  icon="cart-check"
                  label="Đơn hàng"
                  actual={`${current.actualOrders}`}
                  target={`${current.targetOrders} đơn`}
                  percent={orderPercent}
                  color={metricPalette.primary.color}
                />
                <ProgressRow
                  icon="map-marker-check-outline"
                  label="Ghé thăm"
                  actual={`${current.actualVisits}`}
                  target={`${current.targetVisits} lượt`}
                  percent={visitPercent}
                  color={metricPalette.route.color}
                />
              </View>
            </View>

            <View style={styles.insightRow}>
              <InsightCard
                icon="chart-timeline-variant"
                label="Trung bình"
                value={`${averageScore}%`}
                color={metricPalette.primary.color}
                bg={metricPalette.primary.bg}
              />
              <InsightCard
                icon="trophy-outline"
                label="Kỳ tốt nhất"
                value={best ? `${Math.round(best.performanceRate || 0)}%` : "-"}
                hint={best ? `${best.month}/${best.year}` : "Chưa có"}
                color={metricPalette.warning.color}
                bg={metricPalette.warning.bg}
              />
            </View>
          </>
        )}

        <View style={styles.historyCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Lịch sử KPI</Text>
              <Text style={styles.sectionHint}>{kpis.length} kỳ đã ghi nhận</Text>
            </View>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={21}
              color={bento.textMuted}
            />
          </View>

          {history.length === 0 ? (
            <Text style={styles.emptyHistory}>Chưa có dữ liệu kỳ trước.</Text>
          ) : (
            <View style={styles.historyList}>
              {history.map((item) => (
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
          )}
        </View>
      </View>
    </ScrollView>
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
          accessibilityRole="button"
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
          accessibilityRole="button"
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

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View
      style={[styles.summaryCard, { backgroundColor: color, borderColor: color }]}
    >
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons name={icon} size={15} color="#FFFFFF" />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ProgressRow({
  icon,
  label,
  actual,
  target,
  percent,
  color,
}: {
  icon: IconName;
  label: string;
  actual: string;
  target: string;
  percent: number;
  color: string;
}) {
  const rounded = Math.round(percent);

  return (
    <View style={styles.progressRow}>
      <View style={[styles.progressIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.progressBody}>
        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={[styles.progressPercent, { color }]}>{rounded}%</Text>
        </View>
        <Text style={styles.progressMeta} numberOfLines={1}>
          {actual} / {target}
        </Text>
        <ProgressBar percent={percent} color={color} />
      </View>
    </View>
  );
}

function InsightCard({
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
    <View style={[styles.insightCard, { borderColor: bg }]}>
      <View style={[styles.insightIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.insightText}>
        <Text style={styles.insightLabel}>{label}</Text>
        <Text style={styles.insightValue}>{value}</Text>
        {hint ? <Text style={styles.insightHint}>{hint}</Text> : null}
      </View>
    </View>
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
  const tone = scoreColor(score);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyRow,
        selected && styles.historyRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.historyIcon, { backgroundColor: tone.text }]}>
        <MaterialCommunityIcons
          name="chart-timeline-variant"
          size={17}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.historyText}>
        <Text style={styles.historyTitle}>
          Tháng {item.month}/{item.year}
        </Text>
        <Text style={styles.historyMeta} numberOfLines={1}>
          {currency(item.actualRevenue)} · {item.actualOrders} đơn ·{" "}
          {item.actualVisits} lượt
        </Text>
      </View>
      <View
        style={[
          styles.historyScore,
          { backgroundColor: tone.bg, borderColor: tone.border },
        ]}
      >
        <Text style={[styles.historyScoreText, { color: tone.text }]}>
          {score}%
        </Text>
      </View>
    </Pressable>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
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

function reviewLabel(score: number) {
  if (score >= 100) return "Vượt mục tiêu";
  if (score >= 70) return "Đang tốt";
  return "Cần bứt tốc";
}

function scoreColor(score: number) {
  if (score >= 100) {
    return {
      text: metricPalette.success.color,
      bg: metricPalette.success.bg,
      border: "#A7F3D0",
    };
  }
  if (score >= 70) {
    return {
      text: metricPalette.primary.color,
      bg: metricPalette.primary.bg,
      border: "#BFDBFE",
    };
  }
  return {
    text: metricPalette.warning.color,
    bg: metricPalette.warning.bg,
    border: "#FDE68A",
  };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: "100%",
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  periodCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
    ...bentoSoftShadow,
  },
  stepper: { flex: 1, gap: 7, minWidth: 0 },
  stepperLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  stepperControl: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
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
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 128,
    flexDirection: "row",
    flexGrow: 1,
    gap: 8,
    minHeight: 58,
    minWidth: 128,
    paddingHorizontal: 10,
    paddingVertical: 9,
    ...bentoSoftShadow,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  summaryText: { flex: 1, minWidth: 0 },
  summaryLabel: { color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: "700" },
  summaryValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 1 },
  focusCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftColor: "#6D28D9",
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
    ...bentoSoftShadow,
  },
  focusTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  focusCopy: { flex: 1, minWidth: 0 },
  focusLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  focusValue: {
    color: bento.text,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: 2,
  },
  reviewBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reviewText: { fontSize: 12, fontWeight: "700" },
  progressList: { gap: 12 },
  progressRow: { alignItems: "center", flexDirection: "row", gap: 11 },
  progressIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  progressBody: { flex: 1, gap: 5, minWidth: 0 },
  progressHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: { color: bento.text, fontSize: 13, fontWeight: "700" },
  progressPercent: { fontSize: 13, fontWeight: "700" },
  progressMeta: { color: bento.textSecondary, fontSize: 12, fontWeight: "600" },
  barTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    height: 8,
    overflow: "hidden",
  },
  barFill: { borderRadius: 8, height: 8 },
  insightRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  insightCard: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 72,
    minWidth: 150,
    padding: 12,
    ...bentoSoftShadow,
  },
  insightIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  insightText: { flex: 1, minWidth: 0 },
  insightLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "700" },
  insightValue: { color: bento.text, fontSize: 18, fontWeight: "700" },
  insightHint: { color: bento.textMuted, fontSize: 11, fontWeight: "700" },
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
  emptyHistory: {
    color: bento.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 8,
  },
  historyList: { gap: 8 },
  historyRow: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    padding: 9,
  },
  historyRowSelected: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  historyIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  historyText: { flex: 1, minWidth: 0 },
  historyTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  historyMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  historyScore: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  historyScoreText: { fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
