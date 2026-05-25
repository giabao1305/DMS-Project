import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  EmptyState,
  ErrorBanner,
  FilterTabs,
  ListCard,
  ListScreen,
  MockupHeader,
  SearchBar,
  SummaryMetric,
  SummaryStrip,
  Timeline,
  TimelineItem,
} from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Customer, RouteCustomerStatus, RoutePlan, Visit, VisitStatus } from "../../types/domain";
import { getCustomerId, getCustomerName } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type CreateVisitPayload = { routeId?: string; customerId?: string };
type VisitTab = "all" | "in_progress" | "upcoming" | "completed";

type VisitTimelineItem =
  | { type: "visit"; id: string; title: string; subtitle: string; time: string; status: VisitStatus; visit: Visit }
  | { type: "route"; id: string; title: string; subtitle: string; time: string; status: RouteCustomerStatus; routeId: string; customerId?: string };

const TABS: Array<{ key: VisitTab; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "in_progress", label: "Đang ghé" },
  { key: "upcoming", label: "Sắp ghé" },
  { key: "completed", label: "Hoàn tất" },
];

export function VisitsList({
  visits,
  routes,
  error,
  activeVisit,
  onBack,
  onCreate,
  onDetail,
}: {
  visits: Visit[];
  routes: RoutePlan[];
  error?: string;
  activeVisit?: Visit;
  onBack: () => void;
  onCreate: (payload?: CreateVisitPayload) => void;
  onDetail: (visit: Visit) => void;
}) {
  const [activeTab, setActiveTab] = useState<VisitTab>("all");
  const [query, setQuery] = useState("");

  const timeline = useMemo(() => buildTimeline(visits, routes), [visits, routes]);
  const stats = useMemo(() => {
    const all = timeline.length;
    const completed = timeline.filter((item) => itemStatus(item) === "completed").length;
    const inProgress = timeline.filter((item) => itemStatus(item) === "in_progress").length;
    const upcoming = timeline.filter((item) => itemStatus(item) === "upcoming").length;
    const percent = all ? Math.round((completed / all) * 100) : 0;
    return { all, completed, inProgress, upcoming, percent };
  }, [timeline]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return timeline.filter((item) => {
      const matchesQuery = !normalizedQuery || item.title.toLowerCase().includes(normalizedQuery) || item.subtitle.toLowerCase().includes(normalizedQuery);
      return matchesTab(item, activeTab) && matchesQuery;
    });
  }, [activeTab, query, timeline]);

  return (
    <ListScreen>
      <MockupHeader
        eyebrow="Field visits"
        title="Lịch ghé thăm"
        subtitle={`${filtered.length} điểm phù hợp`}
        onBack={onBack}
        action={
          <Pressable onPress={() => (activeVisit ? onDetail(activeVisit) : onCreate())} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={activeVisit ? "eye-outline" : "plus"} size={20} color="#fff" />
          </Pressable>
        }
      />

      <SummaryStrip>
        <SummaryMetric icon="chart-donut" label={dateTitle(routes, visits)} value={`${stats.percent}%`} tone="primary" />
        <SummaryMetric icon="calendar-text-outline" label="Tất cả" value={`${stats.all}`} tone="blue" />
        <SummaryMetric icon="map-marker-check-outline" label="Đang ghé" value={`${stats.inProgress}`} tone="warning" />
        <SummaryMetric icon="clock-outline" label="Còn lại" value={`${stats.upcoming}`} tone="success" />
      </SummaryStrip>

      {activeVisit ? (
        <Pressable onPress={() => onDetail(activeVisit)} style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}>
          <View style={styles.activeAvatar}>
            <MaterialCommunityIcons name="store-clock-outline" size={22} color={bento.primary} />
          </View>
          <View style={styles.activeText}>
            <Text style={styles.activeLabel}>Đang check-in</Text>
            <Text style={styles.activeTitle} numberOfLines={1}>{getCustomerName(activeVisit.customer)}</Text>
            <Text style={styles.activeSub} numberOfLines={1}>{timeLabel(activeVisit.checkInTime)} - {getRouteName(activeVisit.route)}</Text>
          </View>
          <View style={styles.activeAction}>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
          </View>
        </Pressable>
      ) : null}

      <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm điểm ghé, tuyến, địa chỉ..." actionIcon="tune-variant" />

      <FilterTabs items={TABS} value={activeTab} onChange={setActiveTab} />

      <ErrorBanner message={error} />

      <ListCard>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Timeline ghé thăm</Text>
            <Text style={styles.sectionHint}>{filtered.length} điểm phù hợp</Text>
          </View>
          <Pressable onPress={() => (activeVisit ? onDetail(activeVisit) : onCreate())} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={activeVisit ? "eye-outline" : "map-marker-plus-outline"} size={15} color="#fff" />
            <Text style={styles.createButtonText}>{activeVisit ? "Xem" : "Check-in"}</Text>
          </Pressable>
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="Chưa có lịch ghé thăm" message="Bạn có thể check-in ngoài tuyến hoặc chờ tuyến được phân công." icon="map-marker-plus-outline" actionLabel={activeVisit ? undefined : "Check-in"} onAction={activeVisit ? undefined : () => onCreate()} />
        ) : (
          <Timeline>
            {filtered.map((item, index) => (
              <TimelineRow key={item.id} item={item} index={index} isLast={index === filtered.length - 1} activeVisit={activeVisit} onCreate={onCreate} onDetail={onDetail} />
            ))}
          </Timeline>
        )}
      </ListCard>
    </ListScreen>
  );
}

function TimelineRow({ item, index, isLast, activeVisit, onCreate, onDetail }: { item: VisitTimelineItem; index: number; isLast: boolean; activeVisit?: Visit; onCreate: (payload?: CreateVisitPayload) => void; onDetail: (visit: Visit) => void }) {
  const status = itemStatus(item);
  const tone = statusTone(status);
  const press = () => {
    if (item.type === "visit") return onDetail(item.visit);
    if (!activeVisit && !isCheckedRouteCustomer(item.status)) onCreate({ routeId: item.routeId, customerId: item.customerId });
  };

  return (
    <TimelineItem color={tone.color} bg={tone.bg} index={index} isLast={isLast}>
      <Pressable onPress={press} style={({ pressed }) => [styles.visitCard, pressed && styles.pressed]}>
        <View style={styles.visitTop}>
          <View style={[styles.visitIcon, { backgroundColor: tone.bg }]}>
            <MaterialCommunityIcons name={statusIcon(status)} size={21} color={tone.color} />
          </View>
          <View style={styles.visitMain}>
            <View style={styles.visitTitleRow}>
              <Text style={styles.visitTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                <Text style={[styles.statusText, { color: tone.color }]}>{statusLabelText(status)}</Text>
              </View>
            </View>
            <Text style={styles.visitSubtitle} numberOfLines={1}>{item.subtitle}</Text>
          </View>
        </View>
        <View style={styles.visitFooter}>
          <View style={styles.footerMeta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={bento.textSecondary} />
            <Text style={styles.footerText}>{item.time}</Text>
          </View>
          <View style={styles.footerMeta}>
            <MaterialCommunityIcons name={item.type === "visit" ? "clipboard-check-outline" : "map-marker-path"} size={14} color={bento.textSecondary} />
            <Text style={styles.footerText}>{item.type === "visit" ? "Đã tạo lượt ghé" : "Trong tuyến"}</Text>
          </View>
          <View style={[styles.cardAction, status === "completed" && styles.cardActionMuted]}>
            <Text style={[styles.cardActionText, status === "completed" && styles.cardActionTextMuted]}>{item.type === "visit" ? "Chi tiết" : activeVisit || status === "completed" ? "Xem" : "Check-in"}</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={status === "completed" ? bento.textSecondary : "#fff"} />
          </View>
        </View>
      </Pressable>
    </TimelineItem>
  );
}

function buildTimeline(visits: Visit[], routes: RoutePlan[]): VisitTimelineItem[] {
  const visitItems: VisitTimelineItem[] = visits.map((visit) => ({
    type: "visit",
    id: `visit-${visit._id}`,
    title: getCustomerName(visit.customer),
    subtitle: getRouteName(visit.route),
    time: timeLabel(visit.checkInTime),
    status: visit.status,
    visit,
  }));
  const visitedCustomerIds = new Set(visits.map((visit) => getCustomerId(visit.customer)).filter(Boolean));
  const routeItems: VisitTimelineItem[] = routes.flatMap((route) =>
    route.customers
      .filter((item) => {
        const customerId = getCustomerId(item.customer);
        return !customerId || !visitedCustomerIds.has(customerId);
      })
      .map((item, index) => ({
        type: "route" as const,
        id: `route-${route._id}-${item.orderIndex}-${getCustomerId(item.customer) || index}`,
        title: getCustomerName(item.customer),
        subtitle: customerAddress(item.customer) || route.name,
        time: item.orderIndex ? `#${item.orderIndex}` : `#${index + 1}`,
        status: item.status || "pending",
        routeId: route._id,
        customerId: getCustomerId(item.customer),
      })),
  );
  return [...visitItems, ...routeItems].sort((a, b) => sortKey(a) - sortKey(b));
}

function matchesTab(item: VisitTimelineItem, tab: VisitTab) {
  const status = itemStatus(item);
  if (tab === "all") return true;
  return status === tab;
}

function itemStatus(item: VisitTimelineItem) {
  if (item.type === "visit") return item.status === "checked_out" ? "completed" : "in_progress";
  return isCheckedRouteCustomer(item.status) ? "completed" : "upcoming";
}

function isCheckedRouteCustomer(status: RouteCustomerStatus) {
  return status === "checked_in" || status === "visited" || status === "skipped";
}

function getRouteName(route?: string | RoutePlan) {
  if (!route) return "Ngoài tuyến";
  return typeof route === "string" ? route : route.name;
}

function customerAddress(customer?: string | Customer) {
  if (!customer || typeof customer === "string") return "";
  return customer.address || "";
}

function timeLabel(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function sortKey(item: VisitTimelineItem) {
  if (item.type === "visit") {
    const date = new Date(item.visit.checkInTime);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  const number = Number(item.time.replace("#", ""));
  return Number.isFinite(number) ? number * 1000 : 0;
}

function dateTitle(routes: RoutePlan[], visits: Visit[]) {
  const source = routes[0]?.workDate || visits[0]?.checkInTime;
  if (!source) return "Hôm nay";
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return source;
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" }).format(date);
}

function statusLabelText(status: string) {
  if (status === "completed") return "Hoàn tất";
  if (status === "in_progress") return "Đang ghé";
  return "Sắp ghé";
}

function statusIcon(status: string): IconName {
  if (status === "completed") return "check-circle-outline";
  if (status === "in_progress") return "map-marker-check-outline";
  return "clock-outline";
}

function statusTone(status: string) {
  if (status === "completed") return { color: bento.success, bg: bento.successSoft };
  if (status === "in_progress") return { color: bento.primary, bg: bento.primarySoft };
  return { color: bento.route, bg: bento.routeSoft };
}

const styles = StyleSheet.create({
  headerAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 14, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  activeCard: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: "#BAF3F4", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13, ...bentoSoftShadow },
  activeAvatar: { alignItems: "center", backgroundColor: bento.surface, borderRadius: 15, height: 46, justifyContent: "center", width: 46 },
  activeText: { flex: 1, minWidth: 0 },
  activeLabel: { color: bento.primaryDark, fontSize: 11, fontWeight: "900" },
  activeTitle: { color: bento.text, fontSize: 15, fontWeight: "900", marginTop: 2 },
  activeSub: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 2 },
  activeAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 13, height: 34, justifyContent: "center", width: 34 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: bento.text, fontSize: 17, fontWeight: "900" },
  sectionHint: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 },
  createButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 999, flexDirection: "row", gap: 6, paddingHorizontal: 13, paddingVertical: 10 },
  createButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  visitCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flex: 1, gap: 13, marginBottom: 12, padding: 13, ...bentoSoftShadow },
  visitTop: { alignItems: "center", flexDirection: "row", gap: 11 },
  visitIcon: { alignItems: "center", borderRadius: 15, height: 46, justifyContent: "center", width: 46 },
  visitMain: { flex: 1, minWidth: 0 },
  visitTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  visitTitle: { color: bento.text, flex: 1, fontSize: 15, fontWeight: "900" },
  visitSubtitle: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 5 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: "900" },
  visitFooter: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: 10 },
  footerMeta: { alignItems: "center", flexDirection: "row", gap: 5 },
  footerText: { color: bento.textSecondary, fontSize: 11, fontWeight: "800" },
  cardAction: { alignItems: "center", backgroundColor: bento.text, borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  cardActionMuted: { backgroundColor: bento.border },
  cardActionText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  cardActionTextMuted: { color: bento.textSecondary },
  pressed: { opacity: 0.72 },
});
