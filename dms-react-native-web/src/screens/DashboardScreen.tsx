import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { ErrorBanner, LoadingState, StatusPill } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoSoftShadow } from "../theme";
import type { AuthUser, RoutePlan, Visit } from "../types/domain";
import {
  currency,
  getCustomerId,
  getCustomerName,
  statusLabel,
} from "../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tone =
  | "primary"
  | "route"
  | "routeAlt"
  | "violet"
  | "success"
  | "warning"
  | "danger"
  | "muted";
type VisitCreateIntent = { routeId?: string; customerId?: string };

export function DashboardScreen({
  user,
  onOpenTab,
  onCreateOrder,
  onCreateVisit,
}: {
  user: AuthUser;
  onOpenTab: (tab: SellerTab) => void;
  onCreateOrder: (customerId?: string) => void;
  onCreateVisit: (intent: VisitCreateIntent) => void;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const { data, loading, error, reload } = useResource(sellerApi.dashboard, []);
  const {
    data: visits,
    loading: visitsLoading,
    error: visitsError,
    reload: reloadVisits,
  } = useResource(sellerApi.visits, []);
  useRegisterRefresh(async () => {
    await Promise.all([reload(), reloadVisits()]);
  }, [reload, reloadVisits]);

  if (loading || visitsLoading) return <LoadingState />;

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
  const currentRoute = selectCurrentRoute(routes);
  const nextStop = currentRoute?.customers.find(
    (item) => !item.status || item.status === "pending",
  );
  const activeVisit = visits?.find((visit) => visit.status === "checked_in");
  const deliveryPercent = percent(deliveredOrders, totalOrders);
  const approvedPercent = percent(approvedCustomers, totalCustomers);
  const attentionTotal =
    pendingOrders +
    pendingCustomers +
    unreadNotifications +
    routeSummary.remaining;
  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date());

  return (
    <View style={styles.page}>
      <View style={styles.heading}>
        <View style={styles.heroIdentity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials(user.fullName || user.email)}
            </Text>
          </View>
          <View style={styles.headingText}>
            <Text style={styles.heroEyebrow}>Hôm nay</Text>
            <Text style={styles.title}>
              Chào {shortName(user.fullName || user.email)}
            </Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Thông báo"
          onPress={() => onOpenTab("notifications")}
          style={(state) => [
            styles.bell,
            isHovered(state) && styles.headerButtonHover,
            state.pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={21}
            color="#FFFFFF"
          />
          {unreadNotifications > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ErrorBanner message={error || visitsError} />

      <View style={styles.metrics}>
        <Metric
          icon="cash-multiple"
          label="Doanh số"
          value={compactMoney(totalRevenue)}
          detail={`${deliveryPercent}% đơn đã giao`}
          tone="success"
          onPress={() => onOpenTab("kpis")}
        />
        <Metric
          icon="clipboard-text-outline"
          label="Đơn hàng"
          value={`${totalOrders}`}
          detail={`${pendingOrders} chờ duyệt`}
          tone="warning"
          onPress={() => onOpenTab("orders")}
        />
        <Metric
          icon="map-marker-check-outline"
          label="Ghé thăm"
          value={`${totalVisits}`}
          detail={`${routeSummary.remaining} điểm còn lại`}
          tone="routeAlt"
          onPress={() => onOpenTab("visits")}
        />
        <Metric
          icon="storefront-outline"
          label="Điểm bán"
          value={`${totalCustomers}`}
          detail={`${approvedPercent}% đã duyệt`}
          tone="violet"
          onPress={() => onOpenTab("customers")}
        />
      </View>

      <View style={[styles.columns, wide && styles.columnsWide]}>
        <View style={[styles.primaryColumn, wide && styles.primaryColumnWide]}>
          {activeVisit ? (
            <ActiveVisitPanel
              visit={activeVisit}
              onCreateOrder={() =>
                onCreateOrder(getCustomerId(activeVisit.customer) || undefined)
              }
              onOpenVisit={() => onOpenTab("visits")}
            />
          ) : null}
          <RoutePanel
            route={currentRoute}
            onOpenRoute={() => onOpenTab("routes")}
            onCheckIn={() => {
              if (currentRoute?.status === "planned") {
                onOpenTab("routes");
                return;
              }
              const customerId = nextStop
                ? getCustomerId(nextStop.customer)
                : "";
              if (currentRoute && customerId) {
                onCreateVisit({ routeId: currentRoute._id, customerId });
                return;
              }
              onOpenTab("visits");
            }}
          />
        </View>

        <View
          style={[styles.secondaryColumn, wide && styles.secondaryColumnWide]}
        >
          <ActionPanel
            activeVisit={activeVisit}
            requiresRouteStart={currentRoute?.status === "planned"}
            onCreateOrder={() =>
              onCreateOrder(
                activeVisit
                  ? getCustomerId(activeVisit.customer) || undefined
                  : undefined,
              )
            }
            onCheckIn={() => {
              if (currentRoute?.status === "planned") {
                onOpenTab("routes");
                return;
              }
              const customerId = nextStop
                ? getCustomerId(nextStop.customer)
                : "";
              if (currentRoute && customerId) {
                onCreateVisit({ routeId: currentRoute._id, customerId });
                return;
              }
              onOpenTab("visits");
            }}
            onOpenTab={onOpenTab}
          />
          <AttentionPanel
            total={attentionTotal}
            pendingOrders={pendingOrders}
            pendingCustomers={pendingCustomers}
            unreadNotifications={unreadNotifications}
            remainingStops={routeSummary.remaining}
            onOpenTab={onOpenTab}
          />
        </View>
      </View>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  onPress: () => void;
}) {
  const colors = toneColors(tone);
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [
        styles.metric,
        { backgroundColor: colors.solid, borderColor: colors.solid },
        isHovered(state) && styles.solidHover,
        state.pressed && styles.pressed,
      ]}
    >
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricIcon}>
          <MaterialCommunityIcons name={icon} size={17} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricDetail} numberOfLines={1}>
        {detail}
      </Text>
    </Pressable>
  );
}

function ActiveVisitPanel({
  visit,
  onCreateOrder,
  onOpenVisit,
}: {
  visit: Visit;
  onCreateOrder: () => void;
  onOpenVisit: () => void;
}) {
  const routeName = typeof visit.route === "string" ? "" : visit.route?.name;
  return (
    <View style={[styles.panel, styles.activeVisitPanel]}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Đang ghé thăm</Text>
        <StatusPill label="Đang check-in" tone="success" compact />
      </View>
      <View style={styles.activeVisitBody}>
        <View style={styles.activeVisitIcon}>
          <MaterialCommunityIcons
            name="store-marker-outline"
            size={21}
            color={bento.success}
          />
        </View>
        <View style={styles.activeVisitText}>
          <Text style={styles.activeVisitName} numberOfLines={1}>
            {getCustomerName(visit.customer)}
          </Text>
          <Text style={styles.activeVisitMeta} numberOfLines={1}>
            {checkInTimeLabel(visit.checkInTime)}
            {routeName ? ` · ${routeName}` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.panelActions}>
        <Pressable
          onPress={onCreateOrder}
          style={(state) => [
            styles.primaryAction,
            styles.activeOrderAction,
            isHovered(state) && styles.solidHover,
            state.pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="cart-plus" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Tạo đơn</Text>
        </Pressable>
        <Pressable
          onPress={onOpenVisit}
          style={(state) => [
            styles.secondaryAction,
            isHovered(state) && styles.secondaryActionHover,
            state.pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryActionText}>Xem lượt ghé</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={bento.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function RoutePanel({
  route,
  onOpenRoute,
  onCheckIn,
}: {
  route?: RoutePlan;
  onOpenRoute: () => void;
  onCheckIn: () => void;
}) {
  const summary = summarizeRoutes(route ? [route] : []);
  const routeAction =
    route?.status === "planned"
      ? {
          label: "Xem tuyến được giao",
          icon: "map-marker-path" as IconName,
          onPress: onOpenRoute,
        }
      : route?.status === "completed"
        ? {
            label: "Xem kết quả",
            icon: "check-circle-outline" as IconName,
            onPress: onOpenRoute,
          }
        : {
            label: "Check-in tiếp",
            icon: "crosshairs-gps" as IconName,
            onPress: onCheckIn,
          };
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Tuyến hôm nay</Text>
          <Text style={styles.panelHint}>
            {route
              ? `${route.name} · ${statusLabel(route.status)}`
              : "Chưa được phân tuyến"}
          </Text>
        </View>
        <StatusPill
          label={`${summary.percent}%`}
          tone={summary.percent === 100 ? "success" : "primary"}
          compact
        />
      </View>

      <View style={styles.routeProgress}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>{summary.done} đã ghé</Text>
          <Text style={styles.progressText}>{summary.remaining} còn lại</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${summary.percent}%` }]}
          />
        </View>
      </View>

      <View style={styles.stops}>
        {route?.customers.slice(0, 4).map((item, index) => (
          <StopRow
            key={`${route._id}-${item.orderIndex || index}`}
            item={item}
            index={index}
            onPress={onOpenRoute}
          />
        ))}
        {!route?.customers.length ? (
          <View style={styles.noRoute}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={20}
              color={bento.textMuted}
            />
            <Text style={styles.noRouteText}>
              Không có điểm ghé trong lịch hôm nay
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.panelActions}>
        <Pressable
          onPress={routeAction.onPress}
          style={(state) => [
            styles.primaryAction,
            isHovered(state) && styles.solidHover,
            state.pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={routeAction.icon}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.primaryActionText}>{routeAction.label}</Text>
        </Pressable>
        {routeAction.onPress !== onOpenRoute ? (
          <Pressable
            onPress={onOpenRoute}
            style={(state) => [
              styles.secondaryAction,
              isHovered(state) && styles.secondaryActionHover,
              state.pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryActionText}>Xem tuyến</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={bento.primary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function StopRow({
  item,
  index,
  onPress,
}: {
  item: RoutePlan["customers"][number];
  index: number;
  onPress: () => void;
}) {
  const customer =
    typeof item.customer === "string" ? undefined : item.customer;
  const complete = item.status === "checked_in" || item.status === "visited";
  const skipped = item.status === "skipped";
  const status = complete ? "Đã ghé" : skipped ? "Bỏ qua" : "Chờ ghé";
  const tone: Tone = complete ? "success" : skipped ? "warning" : "muted";
  const colors = toneColors(tone);
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [
        styles.stopRow,
        isHovered(state) && styles.surfaceHover,
        state.pressed && styles.pressed,
      ]}
    >
      <View style={[styles.stopOrder, complete && styles.stopOrderDone]}>
        {complete ? (
          <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />
        ) : (
          <Text style={styles.stopOrderText}>
            {item.orderIndex || index + 1}
          </Text>
        )}
      </View>
      <View style={styles.stopBody}>
        <Text style={styles.stopName} numberOfLines={1}>
          {customer ? getCustomerName(customer) : "Điểm bán"}
        </Text>
        <Text style={styles.stopAddress} numberOfLines={1}>
          {customer?.address || "Chưa có địa chỉ"}
        </Text>
      </View>
      <View style={[styles.stopStatus, { backgroundColor: colors.bg }]}>
        <Text style={[styles.stopStatusText, { color: colors.text }]}>
          {status}
        </Text>
      </View>
    </Pressable>
  );
}

function ActionPanel({
  activeVisit,
  requiresRouteStart,
  onCreateOrder,
  onCheckIn,
  onOpenTab,
}: {
  activeVisit?: Visit;
  requiresRouteStart: boolean;
  onCreateOrder: () => void;
  onCheckIn: () => void;
  onOpenTab: (tab: SellerTab) => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Tác vụ nhanh</Text>
      <View style={styles.actions}>
        {activeVisit ? (
          <ActionButton
            icon="cart-plus"
            label="Tạo đơn"
            tone="warning"
            onPress={onCreateOrder}
          />
        ) : requiresRouteStart ? (
          <ActionButton
            icon="map-marker-check-outline"
            label="Lượt ghé"
            tone="routeAlt"
            onPress={() => onOpenTab("visits")}
          />
        ) : (
          <ActionButton
            icon="crosshairs-gps"
            label="Check-in"
            tone="routeAlt"
            onPress={onCheckIn}
          />
        )}
        <ActionButton
          icon={activeVisit ? "map-marker-check-outline" : "map-marker-path"}
          label={activeVisit ? "Lượt đang ghé" : "Tuyến hôm nay"}
          tone={activeVisit ? "routeAlt" : "route"}
          onPress={() => onOpenTab(activeVisit ? "visits" : "routes")}
        />
        <ActionButton
          icon="storefront-plus-outline"
          label="Điểm bán"
          tone="violet"
          onPress={() => onOpenTab("customers")}
        />
        <ActionButton
          icon="chart-box-outline"
          label="KPI"
          tone="success"
          onPress={() => onOpenTab("kpis")}
        />
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: IconName;
  label: string;
  tone: Tone;
  onPress: () => void;
}) {
  const colors = toneColors(tone);
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [
        styles.actionButton,
        { backgroundColor: colors.solid, borderColor: colors.solid },
        isHovered(state) && styles.solidHover,
        state.pressed && styles.pressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.actionLabelSolid}>{label}</Text>
    </Pressable>
  );
}

function AttentionPanel({
  total,
  pendingOrders,
  pendingCustomers,
  unreadNotifications,
  remainingStops,
  onOpenTab,
}: {
  total: number;
  pendingOrders: number;
  pendingCustomers: number;
  unreadNotifications: number;
  remainingStops: number;
  onOpenTab: (tab: SellerTab) => void;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Cần xử lý</Text>
        <Text style={styles.totalPending}>{total}</Text>
      </View>
      <View style={styles.queue}>
        <QueueRow
          label="Đơn chờ duyệt"
          value={pendingOrders}
          tone="warning"
          tab="orders"
          onOpenTab={onOpenTab}
        />
        <QueueRow
          label="Điểm bán chờ duyệt"
          value={pendingCustomers}
          tone="primary"
          tab="customers"
          onOpenTab={onOpenTab}
        />
        <QueueRow
          label="Thông báo chưa đọc"
          value={unreadNotifications}
          tone="danger"
          tab="notifications"
          onOpenTab={onOpenTab}
        />
        <QueueRow
          label="Điểm chưa ghé"
          value={remainingStops}
          tone="routeAlt"
          tab="visits"
          onOpenTab={onOpenTab}
        />
      </View>
    </View>
  );
}

function QueueRow({
  label,
  value,
  tone,
  tab,
  onOpenTab,
}: {
  label: string;
  value: number;
  tone: Tone;
  tab: SellerTab;
  onOpenTab: (tab: SellerTab) => void;
}) {
  const colors = toneColors(tone);
  return (
    <Pressable
      onPress={() => onOpenTab(tab)}
      style={(state) => [
        styles.queueRow,
        isHovered(state) && styles.surfaceHover,
        state.pressed && styles.pressed,
      ]}
    >
      <Text style={styles.queueLabel}>{label}</Text>
      <Text
        style={[
          styles.queueValue,
          value > 0 && { backgroundColor: colors.iconBg, color: colors.text },
        ]}
      >
        {value}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={bento.textMuted}
      />
    </Pressable>
  );
}

function summarizeRoutes(routes: RoutePlan[]) {
  const total = routes.reduce((sum, route) => sum + route.customers.length, 0);
  const done = routes.reduce(
    (sum, route) =>
      sum +
      route.customers.filter(
        (item) =>
          item.status === "checked_in" ||
          item.status === "visited" ||
          item.status === "skipped",
      ).length,
    0,
  );
  return {
    total,
    done,
    remaining: Math.max(total - done, 0),
    percent: percent(done, total),
  };
}

function selectCurrentRoute(routes: RoutePlan[]) {
  return (
    routes.find((route) => route.status === "in_progress") ||
    routes.find((route) => route.status === "planned") ||
    routes[0]
  );
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function checkInTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang hoạt động";
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `Bắt đầu lúc ${time}`;
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000)
    return `${Number((value / 1_000_000_000).toFixed(1))} tỷ`;
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))} tr`;
  return currency(value);
}

function shortName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) || "bạn";
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2 ? [parts[0][0], parts.at(-1)?.[0]] : [parts[0]?.[0]];
  return letters.filter(Boolean).join("").toUpperCase() || "DS";
}

function isHovered(state: { pressed: boolean }) {
  return Boolean((state as { hovered?: boolean }).hovered);
}

function toneColors(tone: Tone) {
  if (tone === "success")
    return {
      text: "#047857",
      solid: "#059669",
      bg: "#ECFDF5",
      iconBg: "#D1FAE5",
      border: "#A7F3D0",
    };
  if (tone === "warning")
    return {
      text: "#B45309",
      solid: "#D97706",
      bg: "#FFFAEF",
      iconBg: "#FEF3C7",
      border: "#F4DFB6",
    };
  if (tone === "danger")
    return {
      text: bento.danger,
      solid: "#DC2626",
      bg: "#FFF5F5",
      iconBg: bento.dangerSoft,
      border: "#FACFD2",
    };
  if (tone === "routeAlt")
    return {
      text: "#0369A1",
      solid: "#0284C7",
      bg: "#F0F9FF",
      iconBg: "#E0F2FE",
      border: "#BAE6FD",
    };
  if (tone === "violet")
    return {
      text: "#6D28D9",
      solid: "#7C3AED",
      bg: "#F5F3FF",
      iconBg: "#EDE9FE",
      border: "#DDD6FE",
    };
  if (tone === "route")
    return {
      text: "#0369A1",
      solid: "#0284C7",
      bg: "#F0F9FF",
      iconBg: "#E0F2FE",
      border: "#BAE6FD",
    };
  if (tone === "muted")
    return {
      text: bento.textSecondary,
      solid: "#64748B",
      bg: bento.surfaceAlt,
      iconBg: bento.surface,
      border: bento.border,
    };
  return {
    text: "#1D4ED8",
    solid: "#2563EB",
    bg: "#F2F6FF",
    iconBg: "#DBEAFE",
    border: "#BFDBFE",
  };
}

const styles = StyleSheet.create({
  page: {
    alignSelf: "center",
    backgroundColor: bento.background,
    gap: 16,
    maxWidth: 1080,
    minHeight: "100%",
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    width: "100%",
  },
  heading: {
    alignItems: "center",
    backgroundColor: "#103494",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginHorizontal: -16,
    marginTop: -16,
    overflow: "hidden",
    paddingBottom: 34,
    paddingHorizontal: 16,
    paddingTop: 14,
    position: "relative",

    shadowColor: "#103494",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },

  heroIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },

  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: 10,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  headingText: {
    flex: 1,
    minWidth: 0,
  },

  heroEyebrow: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    color: "rgba(255,255,255,0.86)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: "uppercase",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    marginTop: 6,
    letterSpacing: 0,
  },

  date: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "capitalize",
  },
  bell: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: 10,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    position: "relative",
    width: 42,
  },

  badge: {
    alignItems: "center",
    backgroundColor: "#FF4D4F",
    borderColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 19,
    paddingHorizontal: 4,
    position: "absolute",
    right: -5,
    top: -5,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: -24,
  },
  metric: {
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 140,
    flexGrow: 1,
    gap: 3,
    minHeight: 88,
    minWidth: 136,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...bentoSoftShadow,
  },
  metricTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 5,
    height: 27,
    justifyContent: "center",
    width: 27,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "600",
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  metricDetail: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
  columns: {
    gap: 12,
  },
  columnsWide: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  primaryColumn: {
    gap: 12,
    width: "100%",
  },
  primaryColumnWide: {
    flex: 1.48,
    minWidth: 0,
  },
  secondaryColumn: {
    gap: 12,
    width: "100%",
  },
  secondaryColumnWide: {
    flex: 1,
    minWidth: 290,
  },
  panel: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 13,
    padding: 14,
    ...bentoSoftShadow,
  },
  activeVisitPanel: {
    borderColor: bento.borderStrong,
  },
  activeVisitBody: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  activeVisitIcon: {
    alignItems: "center",
    backgroundColor: bento.successSoft,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  activeVisitText: {
    flex: 1,
    minWidth: 0,
  },
  activeVisitName: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "700",
  },
  activeVisitMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "700",
  },
  panelHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
    maxWidth: 270,
  },
  routeProgress: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 4,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: bento.primary,
    borderRadius: 4,
    height: 8,
  },
  stops: {
    gap: 8,
  },
  stopRow: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    padding: 9,
  },
  stopOrder: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  stopOrderDone: {
    backgroundColor: bento.success,
    borderColor: bento.success,
  },
  stopOrderText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  stopBody: {
    flex: 1,
    minWidth: 0,
  },
  stopName: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "700",
  },
  stopAddress: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  stopStatus: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stopStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  noRoute: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 62,
    paddingHorizontal: 12,
  },
  noRouteText: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  panelActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 45,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  activeOrderAction: {
    backgroundColor: bento.order,
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 45,
  },
  secondaryActionText: {
    color: bento.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 10,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 5,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  actionLabelSolid: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  totalPending: {
    backgroundColor: bento.warningSoft,
    borderRadius: 6,
    color: bento.warning,
    fontSize: 13,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  queue: {
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  queueRow: {
    alignItems: "center",
    borderBottomColor: bento.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 47,
    paddingHorizontal: 11,
  },
  queueLabel: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  queueValue: {
    borderRadius: 6,
    color: bento.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 4,
    minWidth: 28,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
  },
  headerButtonHover: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  solidHover: {
    opacity: 0.92,
  },
  surfaceHover: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  secondaryActionHover: {
    backgroundColor: bento.surface,
    borderColor: bento.primary,
  },
});
