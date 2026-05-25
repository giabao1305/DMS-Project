import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  EmptyState,
  ErrorBanner,
  FilterTabs,
  ListCard,
  ListScreen,
  MiniTimelineRow,
  MockupHeader,
  SearchBar,
  StatusPill,
  SummaryMetric,
  SummaryStrip,
  SuccessBanner,
} from "../../components/Ui";
import { bento } from "../../theme";
import type { RoutePlan, RouteStatus } from "../../types/domain";
import { shortDate, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type RouteFilter = "all" | RouteStatus;
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

const FILTERS: { key: RouteFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "planned", label: "Chưa chạy" },
  { key: "in_progress", label: "Đang chạy" },
  { key: "completed", label: "Hoàn thành" },
];

export function RoutesList({
  routes,
  error,
  actionError,
  actionMessage,
  updatingRouteId,
  onBack,
  onDetail,
  onUpdateStatus,
}: {
  routes: RoutePlan[];
  error?: string;
  actionError?: string;
  actionMessage?: string;
  updatingRouteId?: string;
  onBack: () => void;
  onDetail: (route: RoutePlan) => void;
  onUpdateStatus: (route: RoutePlan, status: "in_progress" | "completed") => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RouteFilter>("all");

  const stats = useMemo(
    () => ({
      total: routes.length,
      running: routes.filter((route) => route.status === "in_progress").length,
      completed: routes.filter((route) => route.status === "completed").length,
      points: routes.reduce((sum, route) => sum + route.customers.length, 0),
      progress: summarizeRoutes(routes),
    }),
    [routes],
  );

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return routes.filter((route) => {
      const matchesFilter = filter === "all" || route.status === filter;
      const matchesQuery = !normalizedQuery || route.name.toLowerCase().includes(normalizedQuery) || shortDate(route.workDate).toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, routes]);

  const hasActiveSearch = query.trim().length > 0 || filter !== "all";

  return (
    <ListScreen>
      <MockupHeader
        eyebrow="Tuyến bán hàng"
        title="Lịch tuyến"
        subtitle={`${filteredRoutes.length} kết quả`}
        onBack={onBack}
        action={
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="map-marker-path" size={21} color={bento.primaryDark} />
          </View>
        }
      />

      <SummaryStrip>
        <SummaryMetric icon="navigation-variant-outline" label="Tiến độ" value={`${stats.progress.percent}%`} tone="primary" />
        <SummaryMetric icon="map-marker-path" label="Tuyến" value={`${stats.total}`} tone="blue" />
        <SummaryMetric icon="play-circle-outline" label="Đang chạy" value={`${stats.running}`} tone="warning" />
        <SummaryMetric icon="store-marker-outline" label="Điểm bán" value={`${stats.points}`} tone="success" />
      </SummaryStrip>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>{stats.progress.done}/{stats.progress.total} điểm đã qua</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${stats.progress.percent}%` }]} />
        </View>
      </View>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm tuyến bán, ngày làm việc..." />

      <FilterTabs items={FILTERS} value={filter} onChange={setFilter} />

      <ErrorBanner message={error || actionError} />
      <SuccessBanner message={actionMessage} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách tuyến</Text>
          <Text style={styles.sectionHint}>{filteredRoutes.length} kết quả hiển thị</Text>
        </View>
        <Text style={styles.sectionMeta}>{stats.completed} hoàn thành</Text>
      </View>

      {filteredRoutes.length === 0 ? (
        <EmptyState
          title={routes.length === 0 ? "Chưa có tuyến" : "Không có tuyến phù hợp"}
          message={routes.length === 0 ? "Quản trị viên hoặc nhà phân phối sẽ phân tuyến cho bạn." : hasActiveSearch ? "Thử đổi từ khóa hoặc bộ lọc trạng thái." : "Hiện chưa có dữ liệu phù hợp để hiển thị."}
          icon="map-marker-path"
        />
      ) : (
        <View style={styles.list}>
          {filteredRoutes.map((route) => (
            <RouteCard key={route._id} route={route} updating={updatingRouteId === route._id} onPress={() => onDetail(route)} onUpdateStatus={onUpdateStatus} />
          ))}
        </View>
      )}
    </ListScreen>
  );
}

function RouteCard({ route, onPress, onUpdateStatus, updating }: { route: RoutePlan; onPress: () => void; onUpdateStatus: (route: RoutePlan, status: "in_progress" | "completed") => Promise<void>; updating?: boolean }) {
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
    <ListCard onPress={onPress}>
      <View style={styles.routeTop}>
        <View style={[styles.routeIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <MaterialCommunityIcons name={routeIcon(route.status)} size={22} color={tone.text} />
        </View>
        <View style={styles.routeInfo}>
          <View style={styles.routeTitleLine}>
            <Text style={styles.routeName} numberOfLines={1}>{route.name}</Text>
            <StatusPill label={statusLabel(route.status)} tone={tone.pillTone} compact />
          </View>
          <Text style={styles.routeMeta} numberOfLines={1}>{shortDate(route.workDate)} - {route.customers.length} điểm bán</Text>
        </View>
      </View>

      <View style={styles.routeProgressLine}>
        <Text style={styles.routeProgressLabel}>{progress.done}/{progress.total} hoàn tất</Text>
        <Text style={[styles.progressPercent, { color: tone.text }]}>{progress.percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress.percent}%`, backgroundColor: tone.text }]} />
      </View>

      <RouteStops route={route} />

      <View style={styles.routeFooter}>
        <View style={styles.footerMeta}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={bento.textSecondary} />
          <Text style={styles.footerText}>{shortDate(route.workDate)}</Text>
        </View>
        {route.status === "planned" ? (
          <Pressable disabled={updating} onPress={() => confirmUpdate("in_progress")} style={({ pressed }) => [styles.actionPill, pressed && styles.pressed, updating && styles.disabled]}>
            {updating ? <ActivityIndicator size="small" color={bento.primaryDark} /> : <MaterialCommunityIcons name="play" size={14} color={bento.primaryDark} />}
            <Text style={styles.actionPillText}>{updating ? "Đang..." : "Bắt đầu"}</Text>
          </Pressable>
        ) : route.status === "in_progress" ? (
          <Pressable disabled={updating} onPress={() => confirmUpdate("completed")} style={({ pressed }) => [styles.actionPillSuccess, pressed && styles.pressed, updating && styles.disabled]}>
            {updating ? <ActivityIndicator size="small" color={bento.success} /> : <MaterialCommunityIcons name="check" size={14} color={bento.success} />}
            <Text style={styles.actionPillSuccessText}>{updating ? "Đang..." : "Xong"}</Text>
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={19} color={bento.textMuted} />
        )}
      </View>
    </ListCard>
  );
}

function RouteStops({ route }: { route: RoutePlan }) {
  const stops = route.customers.slice(0, 3);
  if (stops.length === 0) {
    return (
      <View style={styles.stopEmpty}>
        <MaterialCommunityIcons name="map-marker-off-outline" size={15} color={bento.textMuted} />
        <Text style={styles.stopEmptyText}>Chưa có điểm bán trong tuyến</Text>
      </View>
    );
  }
  return (
    <View style={styles.stops}>
      {stops.map((stop, index) => {
        const done = stop.status === "checked_in" || stop.status === "visited" || stop.status === "skipped";
        return <MiniTimelineRow key={`${route._id}-${index}`} title={customerName(stop.customer)} meta={done ? "Đã ghé" : "Chưa đến"} done={done} index={(stop.orderIndex || index + 1) - 1} />;
      })}
    </View>
  );
}

function summarizeRoutes(routes: RoutePlan[]) {
  const total = routes.reduce((sum, route) => sum + route.customers.length, 0);
  const done = routes.reduce((sum, route) => sum + route.customers.filter((item) => item.status === "checked_in" || item.status === "visited" || item.status === "skipped").length, 0);
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

function routeProgress(route: RoutePlan) {
  const total = route.customers.length;
  const done = route.customers.filter((item) => item.status === "checked_in" || item.status === "visited" || item.status === "skipped").length;
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
  return customer.name || "Điểm bán";
}

function statusTone(status?: string) {
  if (status === "completed") return { ...toneColors("success"), pillTone: "success" as const };
  if (status === "in_progress") return { ...toneColors("primary"), pillTone: "primary" as const };
  if (status === "cancelled") return { ...toneColors("danger"), pillTone: "danger" as const };
  return { ...toneColors("blue"), pillTone: "blue" as const };
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
  headerIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  progressCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, gap: 8, padding: 12 },
  progressLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  sectionHint: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 },
  sectionMeta: { color: bento.primaryDark, fontSize: 12, fontWeight: "900" },
  list: { gap: 12, paddingBottom: 4 },
  routeTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  routeIcon: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  routeInfo: { flex: 1, minWidth: 0 },
  routeTitleLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  routeName: { color: bento.text, flex: 1, fontSize: 16, fontWeight: "900" },
  routeMeta: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 5 },
  routeProgressLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  routeProgressLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  progressPercent: { fontSize: 12, fontWeight: "900" },
  progressTrack: { backgroundColor: bento.surfaceAlt, borderRadius: 999, height: 8, overflow: "hidden" },
  progressFill: { backgroundColor: bento.primary, borderRadius: 999, height: 8 },
  stops: { gap: 8 },
  stopEmpty: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 7, padding: 10 },
  stopEmptyText: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" },
  routeFooter: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "space-between", padding: 10 },
  footerMeta: { alignItems: "center", flexDirection: "row", gap: 5 },
  footerText: { color: bento.textSecondary, fontSize: 11, fontWeight: "800" },
  actionPill: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  actionPillText: { color: bento.primaryDark, fontSize: 11, fontWeight: "900" },
  actionPillSuccess: { alignItems: "center", backgroundColor: bento.successSoft, borderColor: "#BDEEDB", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  actionPillSuccessText: { color: bento.success, fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});
