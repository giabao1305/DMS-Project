import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { Avatar, ErrorBanner, LoadingState, StatusPill } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoShadow, bentoSoftShadow } from "../theme";
import type { AuthUser, RoutePlan } from "../types/domain";
import { currency } from "../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function DashboardScreen({
  user,
  onOpenTab,
}: {
  user: AuthUser;
  onOpenTab: (tab: SellerTab) => void;
}) {
  const { data, loading, error, reload } = useResource(sellerApi.dashboard, []);
  useRegisterRefresh(reload, [reload]);

  if (loading) return <LoadingState />;

  const totalCustomers = data?.totalCustomers || 0;
  const approvedCustomers = data?.approvedCustomers || 0;
  const pendingCustomers = data?.pendingCustomers || 0;
  const totalOrders = data?.totalOrders || 0;
  const pendingOrders = data?.pendingOrders || 0;
  const deliveredOrders = data?.deliveredOrders || 0;
  const totalRevenue = data?.totalRevenue || 0;
  const totalVisits = data?.totalVisits || 0;
  const unreadNotifications = data?.unreadNotifications || 0;
  const routes = data?.todayRoutes || [];
  const routeSummary = summarizeRoutes(routes);
  const deliveryPercent = percent(deliveredOrders, totalOrders);
  const customerPercent = percent(approvedCustomers, totalCustomers);
  const todayLabel = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const workCount = pendingOrders + pendingCustomers + unreadNotifications;

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.greeting}>
            <Text style={styles.hello}>Xin chào,</Text>
            <Text style={styles.name} numberOfLines={1}>{shortName(user.fullName || user.email)}</Text>
          </View>
          <Pressable onPress={() => onOpenTab("notifications")} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />
            {unreadNotifications > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.revenueRow}>
          <Pressable onPress={() => onOpenTab("kpis")} style={({ pressed }) => [styles.revenueCard, pressed && styles.pressed]}>
            <Text style={styles.cardLabelLight}>Doanh số hôm nay</Text>
            <Text style={styles.revenueValue}>{compactMoney(totalRevenue)}</Text>
            <View style={styles.growthPill}>
              <MaterialCommunityIcons name="trending-up" size={14} color={bento.primary} />
              <Text style={styles.growthText}>+{Math.max(1, deliveryPercent)}% với hôm qua</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => onOpenTab("orders")} style={({ pressed }) => [styles.orderMiniCard, pressed && styles.pressed]}>
            <View style={styles.orderIcon}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={bento.primary} />
            </View>
            <Text style={styles.orderValue}>{totalOrders}</Text>
            <Text style={styles.orderLabel}>Đơn hàng</Text>
          </Pressable>
        </View>

        <View style={styles.miniGrid}>
          <MiniStat icon="storefront-outline" label="Khách hàng" value={totalCustomers} note={`+${customerPercent}%`} onPress={() => onOpenTab("customers")} />
          <MiniStat icon="map-marker-check-outline" label="Visit" value={totalVisits} note={`+${routeSummary.percent}%`} onPress={() => onOpenTab("visits")} />
        </View>
      </View>

      <View style={styles.content}>
        <ErrorBanner message={error} />

        <View style={styles.focusCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Cần làm hôm nay</Text>
              <Text style={styles.sectionHint}>{workCount === 0 ? "Không có việc tồn đọng quan trọng" : `${workCount} việc cần xử lý`}</Text>
            </View>
            <StatusPill label={todayLabel} tone="blue" compact />
          </View>
          <View style={styles.focusGrid}>
            <FocusAction
              icon="cart-plus"
              title="Tạo đơn"
              subtitle={`${pendingOrders} đơn chờ duyệt`}
              tone={pendingOrders > 0 ? "warning" : "primary"}
              onPress={() => onOpenTab("orders")}
            />
            <FocusAction
              icon="crosshairs-gps"
              title="Check-in"
              subtitle={`${routeSummary.remaining} điểm chưa ghé`}
              tone={routeSummary.remaining > 0 ? "blue" : "success"}
              onPress={() => onOpenTab("visits")}
            />
            <FocusAction
              icon="navigation-variant-outline"
              title="Tuyến hôm nay"
              subtitle={routes[0]?.name || "Chưa có tuyến"}
              tone={routes.length > 0 ? "success" : "muted"}
              onPress={() => onOpenTab("routes")}
            />
            <FocusAction
              icon="bell-outline"
              title="Thông báo"
              subtitle={`${unreadNotifications} chưa đọc`}
              tone={unreadNotifications > 0 ? "warning" : "muted"}
              onPress={() => onOpenTab("notifications")}
            />
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Doanh số 7 ngày qua</Text>
              <Text style={styles.sectionHint}>{deliveredOrders}/{totalOrders} đơn đã giao</Text>
            </View>
            <StatusPill label={workCount === 0 ? "Ổn định" : `${workCount} việc`} tone={workCount === 0 ? "success" : "warning"} compact />
          </View>
          <SalesChart seed={totalRevenue + totalOrders + totalVisits} />
        </View>

        <View style={styles.quickSection}>
          <View style={styles.quickGrid}>
            <QuickAction icon="cart-plus" label="Tạo đơn" tone="primary" onPress={() => onOpenTab("orders")} />
            <QuickAction icon="crosshairs-gps" label="Check-in" tone="blue" onPress={() => onOpenTab("visits")} />
            <QuickAction icon="account-group-outline" label="Khách hàng" tone="success" onPress={() => onOpenTab("customers")} />
            <QuickAction icon="chart-box-outline" label="KPI" tone="warning" onPress={() => onOpenTab("kpis")} />
          </View>
        </View>

        <View style={styles.routeSummaryCard}>
          <View style={styles.routeSummaryTop}>
            <View>
              <Text style={styles.sectionTitle}>Tuyến hôm nay</Text>
              <Text style={styles.sectionHint}>{todayLabel}</Text>
            </View>
            <Pressable onPress={() => onOpenTab("routes")} style={({ pressed }) => [styles.routeAction, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="navigation-variant-outline" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.routeProgressLine}>
            <View>
              <Text style={styles.routeName} numberOfLines={1}>{routes[0]?.name || "Chưa có tuyến"}</Text>
              <Text style={styles.routeMeta}>{routeSummary.done}/{routeSummary.total} điểm đã qua</Text>
            </View>
            <Text style={styles.routePercent}>{routeSummary.percent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${routeSummary.percent}%` }]} />
          </View>
        </View>

        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>Lịch trình hôm nay</Text>
          <Pressable onPress={() => onOpenTab("routes")} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
            <Text style={styles.textActionLabel}>Xem tất cả</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={bento.primaryDark} />
          </Pressable>
        </View>

        <View style={styles.scheduleList}>
          {routes[0]?.customers.slice(0, 3).map((item, index) => (
            <ScheduleItem key={`${routes[0]._id}-${index}`} item={item} index={index} onPress={() => onOpenTab("routes")} />
          ))}
          {!routes[0]?.customers.length ? (
            <Pressable onPress={() => onOpenTab("routes")} style={({ pressed }) => [styles.emptySchedule, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={22} color={bento.textMuted} />
              <View style={styles.emptyScheduleText}>
                <Text style={styles.emptyScheduleTitle}>Chưa có lịch tuyến</Text>
                <Text style={styles.emptyScheduleSub}>Kiểm tra tuyến hoặc tạo lượt check-in ngoài tuyến.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={bento.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function MiniStat({ icon, label, value, note, onPress }: { icon: IconName; label: string; value: number; note: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.miniStat, pressed && styles.pressed]}>
      <View style={styles.miniIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={bento.primary} />
      </View>
      <View style={styles.miniBody}>
        <Text style={styles.miniLabel}>{label}</Text>
        <Text style={styles.miniValue}>{value}</Text>
      </View>
      <Text style={styles.miniNote}>{note}</Text>
    </Pressable>
  );
}

function QuickAction({ icon, label, tone, onPress }: { icon: IconName; label: string; tone: "primary" | "blue" | "success" | "warning"; onPress: () => void }) {
  const palette = toneStyle(tone);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: palette.bg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={palette.color} />
      </View>
      <Text style={styles.quickText} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function FocusAction({ icon, title, subtitle, tone, onPress }: { icon: IconName; title: string; subtitle: string; tone: "primary" | "blue" | "success" | "warning" | "muted"; onPress: () => void }) {
  const palette = toneStyle(tone);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.focusAction, pressed && styles.pressed]}>
      <View style={[styles.focusIcon, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        <MaterialCommunityIcons name={icon} size={20} color={palette.color} />
      </View>
      <View style={styles.focusText}>
        <Text style={styles.focusTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.focusSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={bento.textMuted} />
    </Pressable>
  );
}

function SalesChart({ seed }: { seed: number }) {
  const values = chartValues(seed);
  const max = Math.max(...values, 1);
  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <View style={styles.chart}>
      <View style={styles.chartLine} />
      {values.map((value, index) => {
        const height = 22 + Math.round((value / max) * 72);
        return (
          <View key={`${value}-${index}`} style={styles.chartColumn}>
            <View style={styles.chartBarWrap}>
              <View style={[styles.chartBar, { height }]} />
              <View style={[styles.chartDot, { bottom: height - 4 }]} />
            </View>
            <Text style={styles.chartLabel}>{labels[index]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ScheduleItem({
  item,
  index,
  onPress,
}: {
  item: RoutePlan["customers"][number];
  index: number;
  onPress: () => void;
}) {
  const customer = typeof item.customer === "string" ? undefined : item.customer;
  const tone = routeCustomerTone(item.status);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.scheduleItem, pressed && styles.pressed]}>
      <Avatar name={customer?.name || "Diem ban"} size={44} tone={tone.avatarTone} />
      <View style={styles.scheduleBody}>
        <Text style={styles.scheduleName} numberOfLines={1}>{customer?.name || "Điểm bán"}</Text>
        <Text style={styles.scheduleAddress} numberOfLines={1}>{customer?.address || `Điểm số ${item.orderIndex || index + 1}`}</Text>
      </View>
      <StatusPill label={routeCustomerLabel(item.status)} tone={tone.pillTone} compact />
    </Pressable>
  );
}

function summarizeRoutes(routes: RoutePlan[]) {
  const total = routes.reduce((sum, route) => sum + route.customers.length, 0);
  const done = routes.reduce(
    (sum, route) =>
      sum +
      route.customers.filter(
        (item) => item.status === "checked_in" || item.status === "visited" || item.status === "skipped",
      ).length,
    0,
  );
  return { total, done, remaining: Math.max(total - done, 0), percent: percent(done, total) };
}

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `${Number((value / 1_000_000_000).toFixed(1))}B`;
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return currency(value);
}

function shortName(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Seller";
  if (words.length === 1) return words[0];
  return words.at(-1) || words[0];
}

function chartValues(seed: number) {
  const base = Math.max(seed, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const wave = ((base / (index + 2)) % 9) + index * 1.5;
    return Math.round(28 + wave * 7 + (index % 2 === 0 ? 10 : 0));
  });
}

function toneStyle(tone: "primary" | "blue" | "success" | "warning" | "muted") {
  if (tone === "blue") return { color: bento.route, bg: bento.routeSoft, border: "#CFE0FF" };
  if (tone === "success") return { color: bento.success, bg: bento.successSoft, border: "#BDEEDB" };
  if (tone === "warning") return { color: bento.warning, bg: bento.warningSoft, border: "#FFE0A8" };
  if (tone === "muted") return { color: bento.textSecondary, bg: bento.surfaceAlt, border: bento.border };
  return { color: bento.primaryDark, bg: bento.primarySoft, border: bento.borderStrong };
}

function routeCustomerTone(status?: string): { pillTone: "primary" | "blue" | "success" | "warning" | "danger" | "muted"; avatarTone: "primary" | "blue" | "success" | "warning" | "danger" | "muted" } {
  if (status === "checked_in" || status === "visited") return { pillTone: "success", avatarTone: "success" };
  if (status === "skipped") return { pillTone: "warning", avatarTone: "warning" };
  return { pillTone: "danger", avatarTone: "blue" };
}

function routeCustomerLabel(status?: string) {
  if (status === "checked_in" || status === "visited") return "Đã check-in";
  if (status === "skipped") return "Bỏ qua";
  return "Chưa đến";
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: bento.surface,
    flex: 1,
    minHeight: "100%",
  },
  hero: {
    backgroundColor: bento.chrome,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: 14,
    overflow: "hidden",
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    position: "relative",
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  greeting: {
    flex: 1,
    minWidth: 0,
  },
  hello: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  notificationButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  notificationBadge: {
    alignItems: "center",
    backgroundColor: bento.danger,
    borderColor: bento.chrome,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 20,
    paddingHorizontal: 4,
    position: "absolute",
    right: -4,
    top: -5,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  revenueRow: {
    flexDirection: "row",
    gap: 12,
  },
  revenueCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 126,
    padding: 16,
  },
  cardLabelLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
  },
  revenueValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
  },
  growthPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(74,222,222,0.14)",
    borderColor: "rgba(74,222,222,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  growthText: {
    color: bento.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  orderMiniCard: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    justifyContent: "space-between",
    padding: 14,
    width: 112,
    ...bentoShadow,
  },
  orderIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  orderValue: {
    color: bento.text,
    fontSize: 24,
    fontWeight: "900",
  },
  orderLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  miniGrid: {
    flexDirection: "row",
    gap: 12,
  },
  miniStat: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.13)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    padding: 10,
  },
  miniIcon: {
    alignItems: "center",
    backgroundColor: "rgba(74,222,222,0.14)",
    borderRadius: 13,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  miniBody: {
    flex: 1,
    minWidth: 0,
  },
  miniLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 11,
    fontWeight: "700",
  },
  miniValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  miniNote: {
    color: bento.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  content: {
    alignSelf: "center",
    backgroundColor: bento.surface,
    gap: 16,
    maxWidth: 760,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    width: "100%",
  },
  focusCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  focusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  focusAction: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexDirection: "row",
    flexGrow: 1,
    gap: 10,
    minHeight: 72,
    minWidth: 150,
    padding: 12,
  },
  focusIcon: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  focusText: {
    flex: 1,
    minWidth: 0,
  },
  focusTitle: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "900",
  },
  focusSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  chartCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 9,
    height: 128,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  },
  chartLine: {
    backgroundColor: bento.border,
    height: 1,
    left: 0,
    opacity: 0.8,
    position: "absolute",
    right: 0,
    top: 56,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
    gap: 7,
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBarWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    position: "relative",
    width: "100%",
  },
  chartBar: {
    backgroundColor: bento.routeSoft,
    borderRadius: 999,
    maxWidth: 13,
    width: "54%",
  },
  chartDot: {
    backgroundColor: bento.route,
    borderColor: "#FFFFFF",
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    width: 14,
  },
  chartLabel: {
    color: bento.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  quickSection: {
    gap: 10,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 84,
    paddingHorizontal: 8,
    paddingVertical: 12,
    ...bentoSoftShadow,
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  quickText: {
    color: bento.text,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  routeSummaryCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  routeSummaryTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routeAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  routeProgressLine: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  routeName: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "900",
    maxWidth: 250,
  },
  routeMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  routePercent: {
    color: bento.route,
    fontSize: 22,
    fontWeight: "900",
  },
  progressTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 999,
    height: 9,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: bento.primary,
    borderRadius: 999,
    height: "100%",
  },
  scheduleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  textActionLabel: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  scheduleList: {
    gap: 10,
    paddingBottom: 8,
  },
  scheduleItem: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 76,
    padding: 12,
    ...bentoSoftShadow,
  },
  scheduleBody: {
    flex: 1,
    minWidth: 0,
  },
  scheduleName: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "900",
  },
  scheduleAddress: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  emptySchedule: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 22,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 78,
    padding: 14,
  },
  emptyScheduleText: {
    flex: 1,
    minWidth: 0,
  },
  emptyScheduleTitle: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "900",
  },
  emptyScheduleSub: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.72,
  },
});

