import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  EmptyState,
  ErrorBanner,
  FilterTabs,
  ListCard,
  ListScreen,
  MiniTimelineRow,
  MockupHeader,
  SearchBar,
  SummaryMetric,
  SummaryStrip,
  StatusPill,
} from "../../components/Ui";
import { bento } from "../../theme";
import type { AuthUser, RoutePlan, RouteStatus } from "../../types/domain";
import { getCustomerName, shortDate, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type RouteFilter = "all" | RouteStatus;
type RouteScope = "all" | "today" | "upcoming" | "overdue";
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

const FILTERS: { key: RouteFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "planned", label: "Chưa chạy" },
  { key: "in_progress", label: "Đang chạy" },
  { key: "completed", label: "Hoàn thành" },
];

const SCOPES: { key: RouteScope; label: string }[] = [
  { key: "all", label: "Tất cả ngày" },
  { key: "today", label: "Hôm nay" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "overdue", label: "Quá hạn" },
];

export function RoutesList({
  routes,
  user,
  error,
  onBack,
  onDetail,
}: {
  routes: RoutePlan[];
  user: AuthUser;
  error?: string;
  onBack: () => void;
  onDetail: (route: RoutePlan) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RouteFilter>("all");
  const [scope, setScope] = useState<RouteScope>("all");

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return routes.filter((route) => {
      const matchesFilter = filter === "all" || route.status === filter;
      const matchesScope = scope === "all" || routeDateScope(route) === scope;
      const customerNames = route.customers
        .map((item) => customerName(item.customer).toLowerCase())
        .join(" ");
      const matchesQuery =
        !normalizedQuery ||
        route.name.toLowerCase().includes(normalizedQuery) ||
        shortDate(route.workDate).toLowerCase().includes(normalizedQuery) ||
        customerNames.includes(normalizedQuery);
      return matchesFilter && matchesScope && matchesQuery;
    });
  }, [filter, query, routes, scope]);

  const hasActiveSearch =
    query.trim().length > 0 || filter !== "all" || scope !== "all";
  const summary = summarizeRoutes(routes);
  const running = routes.filter(
    (route) => route.status === "in_progress",
  ).length;
  const planned = routes.filter((route) => route.status === "planned").length;

  return (
    <ListScreen>
      <MockupHeader
        title="Lịch tuyến"
        subtitle={`${filteredRoutes.length} kết quả`}
        onBack={onBack}
        action={
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={21}
              color="#FFFFFF"
            />
          </View>
        }
      />

      <SummaryStrip>
        <SummaryMetric
          label="Đang chạy"
          value={running}
          icon="navigation-variant-outline"
          tone="blue"
        />
        <SummaryMetric
          label="Chờ bắt đầu"
          value={planned}
          icon="clock-outline"
          tone="warning"
        />
        <SummaryMetric
          label="Điểm đã ghé"
          value={`${summary.done}/${summary.total}`}
          icon="map-marker-check-outline"
          tone="success"
        />
        <SummaryMetric
          label="Tiến độ"
          value={`${summary.percent}%`}
          icon="chart-donut"
          tone="primary"
        />
      </SummaryStrip>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Tìm tuyến, ngày, điểm bán..."
      />

      <View style={styles.scopeRow}>
        {SCOPES.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setScope(item.key)}
            style={({ pressed }) => [
              styles.scopeChip,
              scope === item.key && styles.scopeChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.scopeText,
                scope === item.key && styles.scopeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FilterTabs items={FILTERS} value={filter} onChange={setFilter} />

      <ErrorBanner message={error} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách tuyến</Text>
          <Text style={styles.sectionHint}>
            {filteredRoutes.length} kết quả hiển thị
          </Text>
        </View>
        <Text style={styles.sectionMeta}>{routes.length} tổng</Text>
      </View>

      {filteredRoutes.length === 0 ? (
        <EmptyState
          title={
            routes.length === 0 ? "Chưa có tuyến" : "Không có tuyến phù hợp"
          }
          message={
            routes.length === 0
              ? "Quản trị viên hoặc nhà phân phối sẽ phân tuyến cho bạn."
              : hasActiveSearch
                ? "Thử đổi từ khóa hoặc bộ lọc trạng thái."
                : "Hiện chưa có dữ liệu phù hợp để hiển thị."
          }
          icon="map-marker-path"
        />
      ) : (
        <View style={styles.list}>
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route._id}
              route={route}
              user={user}
              onPress={() => onDetail(route)}
            />
          ))}
        </View>
      )}
    </ListScreen>
  );
}

function RouteCard({
  route,
  user,
  onPress,
}: {
  route: RoutePlan;
  user: AuthUser;
  onPress: () => void;
}) {
  const progress = routeProgress(route);
  const tone = statusTone(route.status);
  const substitute = isSubstituteRoute(route, user);

  return (
    <ListCard
      onPress={onPress}
      style={{ borderColor: tone.border, borderLeftColor: tone.text }}
    >
      <View style={styles.routeTop}>
        <View
          style={[
            styles.routeIcon,
            { backgroundColor: tone.text, borderColor: tone.text },
          ]}
        >
          <MaterialCommunityIcons
            name={routeIcon(route.status)}
            size={22}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.routeTitleLine}>
            <Text style={styles.routeName} numberOfLines={1}>
              {route.name}
            </Text>
            <StatusPill
              label={statusLabel(route.status)}
              tone={tone.pillTone}
              compact
            />
            {substitute ? (
              <StatusPill label="Đi thay" tone="warning" compact />
            ) : null}
          </View>
          <Text style={styles.routeMeta} numberOfLines={1}>
            {shortDate(route.workDate)} - {route.customers.length} điểm bán
          </Text>
        </View>
      </View>

      <View style={styles.routeProgressLine}>
        <Text style={styles.routeProgressLabel}>
          {progress.done}/{progress.total} hoàn tất
        </Text>
        <Text style={[styles.progressPercent, { color: tone.text }]}>
          {progress.percent}%
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress.percent}%`, backgroundColor: tone.text },
          ]}
        />
      </View>

      <RouteStops route={route} />

      <View style={styles.routeFooter}>
        <View style={styles.footerMeta}>
          <MaterialCommunityIcons
            name="calendar-outline"
            size={14}
            color={bento.textSecondary}
          />
          <Text style={styles.footerText}>{shortDate(route.workDate)}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={19}
          color={bento.textMuted}
        />
      </View>
    </ListCard>
  );
}

function isSubstituteRoute(route: RoutePlan, user: AuthUser) {
  return getRelationId(route.substituteSeller) === user._id;
}

function getRelationId(value?: string | { _id: string }) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value._id;
}

function RouteStops({ route }: { route: RoutePlan }) {
  const stops = sortRouteCustomers(route.customers).slice(0, 3);
  if (stops.length === 0) {
    return (
      <View style={styles.stopEmpty}>
        <MaterialCommunityIcons
          name="map-marker-off-outline"
          size={15}
          color={bento.textMuted}
        />
        <Text style={styles.stopEmptyText}>Chưa có điểm bán trong tuyến</Text>
      </View>
    );
  }
  return (
    <View style={styles.stops}>
      {stops.map((stop, index) => {
        const done =
          stop.status === "checked_in" ||
          stop.status === "visited" ||
          stop.status === "skipped";
        return (
          <MiniTimelineRow
            key={`${route._id}-${index}`}
            title={customerName(stop.customer)}
            meta={done ? "Đã ghé" : "Chưa đến"}
            done={done}
            index={(stop.orderIndex || index + 1) - 1}
          />
        );
      })}
    </View>
  );
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
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

function routeDateScope(route: RoutePlan): RouteScope {
  const today = dateKey(new Date());
  const routeDay = dateKey(new Date(route.workDate));
  if (routeDay === today) return "today";
  if (routeDay > today) return "upcoming";
  if (route.status !== "completed" && route.status !== "cancelled")
    return "overdue";
  return "all";
}

function dateKey(date: Date) {
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
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

function routeIcon(status: RouteStatus): IconName {
  if (status === "completed") return "check-circle-outline";
  if (status === "in_progress") return "map-marker-check-outline";
  if (status === "cancelled") return "close-circle-outline";
  return "map-marker-path";
}

function customerName(customer: RoutePlan["customers"][number]["customer"]) {
  if (typeof customer === "string") return "Điểm bán";
  return getCustomerName(customer);
}

function statusTone(status?: string) {
  if (status === "completed")
    return { ...toneColors("success"), pillTone: "success" as const };
  if (status === "in_progress")
    return { ...toneColors("primary"), pillTone: "primary" as const };
  if (status === "cancelled")
    return { ...toneColors("danger"), pillTone: "danger" as const };
  return { ...toneColors("blue"), pillTone: "blue" as const };
}

function toneColors(tone: ToneName) {
  if (tone === "success")
    return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (tone === "warning")
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  if (tone === "danger")
    return { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
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
  headerIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  scopeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scopeChip: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 94,
    paddingHorizontal: 11,
  },
  scopeChipActive: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  scopeText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  scopeTextActive: { color: bento.primaryDark },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  sectionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  sectionMeta: { color: bento.primaryDark, fontSize: 12, fontWeight: "700" },
  list: { gap: 12, paddingBottom: 4 },
  routeTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  routeIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  routeInfo: { flex: 1, minWidth: 0 },
  routeTitleLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  routeName: { color: bento.text, flex: 1, fontSize: 16, fontWeight: "700" },
  routeMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  routeProgressLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routeProgressLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  progressPercent: { fontSize: 12, fontWeight: "700" },
  progressTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    height: 8,
    overflow: "hidden",
  },
  progressFill: { backgroundColor: bento.primary, borderRadius: 8, height: 8 },
  stops: { gap: 8 },
  stopEmpty: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    padding: 10,
  },
  stopEmptyText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  routeFooter: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    padding: 10,
  },
  footerMeta: { alignItems: "center", flexDirection: "row", gap: 5 },
  footerText: { color: bento.textSecondary, fontSize: 11, fontWeight: "600" },
  pressed: { opacity: 0.72 },
});
