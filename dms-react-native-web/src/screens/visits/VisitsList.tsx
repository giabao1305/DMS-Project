import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  EmptyState,
  ErrorBanner,
  FilterTabs,
  ListScreen,
  MockupHeader,
  SearchBar,
  SummaryMetric,
  SummaryStrip,
  Timeline,
  TimelineItem,
} from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type {
  Customer,
  RouteCustomerStatus,
  RoutePlan,
  Visit,
  VisitStatus,
} from "../../types/domain";
import { getCustomerId, getCustomerName } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type CreateVisitPayload = { routeId?: string; customerId?: string };
type VisitTab = "all" | "in_progress" | "upcoming" | "completed";
type VisitScope = "all" | "route" | "out_of_route";

type VisitTimelineItem =
  | {
      type: "visit";
      scope: VisitScope;
      id: string;
      title: string;
      subtitle: string;
      time: string;
      sequence: number;
      status: VisitStatus;
      visit: Visit;
    }
  | {
      type: "route";
      scope: "route";
      id: string;
      title: string;
      subtitle: string;
      time: string;
      sequence: number;
      status: RouteCustomerStatus;
      routeId: string;
      customerId?: string;
    };

const TABS: Array<{ key: VisitTab; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "in_progress", label: "Đang check-in" },
  { key: "upcoming", label: "Sắp ghé" },
  { key: "completed", label: "Hoàn tất" },
];

const SCOPES: Array<{ key: VisitScope; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "route", label: "Trong tuyến" },
  { key: "out_of_route", label: "Ngoài tuyến" },
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
  const [activeScope, setActiveScope] = useState<VisitScope>("all");
  const [query, setQuery] = useState("");

  const timeline = useMemo(
    () => buildTimeline(visits, routes),
    [visits, routes],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return timeline.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.subtitle.toLowerCase().includes(normalizedQuery);
      return (
        matchesTab(item, activeTab) &&
        matchesScope(item, activeScope) &&
        matchesQuery
      );
    });
  }, [activeScope, activeTab, query, timeline]);
  const upcomingCount = timeline.filter(
    (item) => itemStatus(item) === "upcoming",
  ).length;
  const completedCount = timeline.filter(
    (item) => itemStatus(item) === "completed",
  ).length;
  const outOfRouteCount = timeline.filter(
    (item) => item.scope === "out_of_route",
  ).length;

  return (
    <ListScreen>
      <MockupHeader
        title="Lịch ghé thăm"
        subtitle={`${filtered.length} điểm phù hợp`}
        onBack={onBack}
        action={
          <Pressable
            onPress={() => (activeVisit ? onDetail(activeVisit) : onCreate())}
            style={({ pressed }) => [
              styles.headerAction,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={activeVisit ? "eye-outline" : "plus"}
              size={20}
              color="#fff"
            />
          </Pressable>
        }
      />

      <SummaryStrip>
        <SummaryMetric
          label="Đang check-in"
          value={activeVisit ? 1 : 0}
          icon="store-clock-outline"
          tone="primary"
        />
        <SummaryMetric
          label="Sắp ghé"
          value={upcomingCount}
          icon="map-marker-path"
          tone="blue"
        />
        <SummaryMetric
          label="Hoàn tất"
          value={completedCount}
          icon="check-circle-outline"
          tone="success"
        />
        <SummaryMetric
          label="Ngoài tuyến"
          value={outOfRouteCount}
          icon="map-marker-off-outline"
          tone="warning"
        />
      </SummaryStrip>

      {activeVisit ? (
        <Pressable
          onPress={() => onDetail(activeVisit)}
          style={({ pressed }) => [
            styles.activeCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.activeAvatar}>
            <MaterialCommunityIcons
              name="store-clock-outline"
              size={22}
              color={bento.primary}
            />
          </View>
          <View style={styles.activeText}>
            <Text style={styles.activeLabel}>
              {getVisitScopeLabel(activeVisit)} · Đang check-in
            </Text>
            <Text style={styles.activeTitle} numberOfLines={1}>
              {getCustomerName(activeVisit.customer)}
            </Text>
            <Text style={styles.activeSub} numberOfLines={1}>
              {timeLabel(activeVisit.checkInTime)} -{" "}
              {getRouteName(activeVisit.route)}
            </Text>
          </View>
          <View style={styles.activeAction}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color="#fff"
            />
          </View>
        </Pressable>
      ) : null}

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Tìm điểm ghé, tuyến, địa chỉ..."
        actionIcon="tune-variant"
      />

      <View style={styles.scopeRow}>
        {SCOPES.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setActiveScope(item.key)}
            style={({ pressed }) => [
              styles.scopeChip,
              activeScope === item.key && styles.scopeChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.scopeText,
                activeScope === item.key && styles.scopeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FilterTabs items={TABS} value={activeTab} onChange={setActiveTab} />

      <ErrorBanner message={error} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Timeline ghé thăm</Text>
          <Text style={styles.sectionHint}>{filtered.length} điểm phù hợp</Text>
        </View>
        <Pressable
          onPress={() => (activeVisit ? onDetail(activeVisit) : onCreate())}
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={activeVisit ? "eye-outline" : "map-marker-plus-outline"}
            size={15}
            color="#fff"
          />
          <Text style={styles.createButtonText}>
            {activeVisit ? "Xem" : "Check-in"}
          </Text>
        </Pressable>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="Chưa có lịch ghé thăm"
          message="Bạn có thể check-in ngoài tuyến hoặc chờ tuyến được phân công."
          icon="map-marker-plus-outline"
          actionLabel={activeVisit ? undefined : "Check-in"}
          onAction={activeVisit ? undefined : () => onCreate()}
        />
      ) : (
        <Timeline>
          {filtered.map((item, index) => (
            <TimelineRow
              key={item.id}
              item={item}
              index={index}
              isLast={index === filtered.length - 1}
              activeVisit={activeVisit}
              onCreate={onCreate}
              onDetail={onDetail}
            />
          ))}
        </Timeline>
      )}
    </ListScreen>
  );
}

function TimelineRow({
  item,
  index,
  isLast,
  activeVisit,
  onCreate,
  onDetail,
}: {
  item: VisitTimelineItem;
  index: number;
  isLast: boolean;
  activeVisit?: Visit;
  onCreate: (payload?: CreateVisitPayload) => void;
  onDetail: (visit: Visit) => void;
}) {
  const status = itemStatus(item);
  const tone = statusTone(status);
  const press = () => {
    if (item.type === "visit") return onDetail(item.visit);
    if (!activeVisit && !isCheckedRouteCustomer(item.status))
      onCreate({ routeId: item.routeId, customerId: item.customerId });
  };

  return (
    <TimelineItem color={tone.color} bg={tone.bg} index={index} isLast={isLast}>
      <Pressable
        onPress={press}
        style={({ pressed }) => [
          styles.visitCard,
          {
            backgroundColor: bento.surface,
            borderColor: tone.color,
            borderLeftColor: tone.color,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.visitTop}>
          <View
            style={[
              styles.visitIcon,
              { backgroundColor: tone.color, borderColor: tone.color },
            ]}
          >
            <MaterialCommunityIcons
              name={statusIcon(status)}
              size={21}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.visitMain}>
            <View style={styles.visitTitleRow}>
              <Text style={styles.visitTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View
                style={[styles.statusPill, { backgroundColor: bento.surface }]}
              >
                <Text style={[styles.statusText, { color: tone.color }]}>
                  {statusLabelText(status)}
                </Text>
              </View>
            </View>
            <Text style={styles.visitSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.visitFooter}>
          <View style={styles.footerMeta}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={bento.textSecondary}
            />
            <Text style={styles.footerText}>{item.time}</Text>
          </View>
          <View style={styles.footerMeta}>
            <MaterialCommunityIcons
              name={
                item.scope === "out_of_route"
                  ? "map-marker-off-outline"
                  : "map-marker-path"
              }
              size={14}
              color={bento.textSecondary}
            />
            <Text style={styles.footerText}>{scopeLabel(item)}</Text>
          </View>
          <View
            style={[
              styles.cardAction,
              status === "completed" && styles.cardActionMuted,
            ]}
          >
            <Text
              style={[
                styles.cardActionText,
                status === "completed" && styles.cardActionTextMuted,
              ]}
            >
              {item.type === "visit"
                ? "Chi tiết"
                : activeVisit || status === "completed"
                  ? "Xem"
                  : "Check-in"}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={14}
              color={status === "completed" ? bento.textSecondary : "#fff"}
            />
          </View>
        </View>
      </Pressable>
    </TimelineItem>
  );
}

function buildTimeline(
  visits: Visit[],
  routes: RoutePlan[],
): VisitTimelineItem[] {
  const visitItems: VisitTimelineItem[] = visits.map((visit) => ({
    type: "visit",
    scope: visit.route ? "route" : "out_of_route",
    id: `visit-${visit._id}`,
    title: getCustomerName(visit.customer),
    subtitle: getRouteName(visit.route),
    time: timeLabel(visit.checkInTime),
    sequence: getVisitSequence(visit, routes),
    status: visit.status,
    visit,
  }));
  const routeItems: VisitTimelineItem[] = routes.flatMap((route) =>
    sortRouteCustomers(route.customers)
      .filter((item) => {
        const customerId = getCustomerId(item.customer);
        return !customerId || !hasRouteVisit(visits, route._id, customerId);
      })
      .map((item, index) => ({
        type: "route" as const,
        scope: "route" as const,
        id: `route-${route._id}-${item.orderIndex}-${getCustomerId(item.customer) || index}`,
        title: getCustomerName(item.customer),
        subtitle: customerAddress(item.customer) || route.name,
        time: item.orderIndex ? `#${item.orderIndex}` : `#${index + 1}`,
        sequence: getRouteSequence(route, item.orderIndex || index + 1),
        status: item.status || "pending",
        routeId: route._id,
        customerId: getCustomerId(item.customer),
      })),
  );
  return [...visitItems, ...routeItems].sort((a, b) => a.sequence - b.sequence);
}

function hasRouteVisit(visits: Visit[], routeId: string, customerId: string) {
  return visits.some(
    (visit) =>
      getCustomerId(visit.customer) === customerId &&
      getRouteId(visit.route) === routeId,
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

function getVisitSequence(visit: Visit, routes: RoutePlan[]) {
  const routeId = getRouteId(visit.route);
  const customerId = getCustomerId(visit.customer);

  if (!routeId) {
    return -getTime(visit.checkInTime);
  }

  const route = routes.find((item) => item._id === routeId);
  const routeCustomer = route?.customers.find(
    (item) => getCustomerId(item.customer) === customerId,
  );

  if (route) {
    return getRouteSequence(route, routeCustomer?.orderIndex);
  }

  return getTime(visit.checkInTime);
}

function getRouteSequence(route: RoutePlan, orderIndex?: number) {
  return getTime(route.workDate) + getRouteOrder(orderIndex);
}

function matchesTab(item: VisitTimelineItem, tab: VisitTab) {
  const status = itemStatus(item);
  if (tab === "all") return true;
  return status === tab;
}

function matchesScope(item: VisitTimelineItem, scope: VisitScope) {
  if (scope === "all") return true;
  return item.scope === scope;
}

function itemStatus(item: VisitTimelineItem) {
  if (item.type === "visit")
    return item.status === "checked_out" ? "completed" : "in_progress";
  return isCheckedRouteCustomer(item.status) ? "completed" : "upcoming";
}

function isCheckedRouteCustomer(status: RouteCustomerStatus) {
  return (
    status === "checked_in" || status === "visited" || status === "skipped"
  );
}

function getRouteName(route?: string | RoutePlan) {
  if (!route) return "Ngoài tuyến";
  return typeof route === "string" ? route : route.name;
}

function getRouteId(route?: string | RoutePlan) {
  if (!route) return undefined;
  return typeof route === "string" ? route : route._id;
}

function scopeLabel(item: VisitTimelineItem) {
  if (item.scope === "out_of_route") return "Ngoài tuyến";
  if (item.type === "visit") return "Đã ghé trong tuyến";
  return "Trong tuyến";
}

function getVisitScopeLabel(visit: Visit) {
  return visit.route ? "Trong tuyến" : "Ngoài tuyến";
}

function customerAddress(customer?: string | Customer) {
  if (!customer || typeof customer === "string") return "";
  return customer.address || "";
}

function timeLabel(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTime(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function statusLabelText(status: string) {
  if (status === "completed") return "Hoàn tất";
  if (status === "in_progress") return "Đang check-in";
  return "Sắp ghé";
}

function statusIcon(status: string): IconName {
  if (status === "completed") return "check-circle-outline";
  if (status === "in_progress") return "map-marker-check-outline";
  return "clock-outline";
}

function statusTone(status: string) {
  if (status === "completed")
    return { color: "#059669", bg: "#ECFDF5" };
  if (status === "in_progress")
    return { color: "#2563EB", bg: "#EFF6FF" };
  return { color: "#0891B2", bg: "#ECFEFF" };
}

const styles = StyleSheet.create({
  headerAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  activeCard: {
    alignItems: "center",
    backgroundColor: bento.successSoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    padding: 13,
    ...bentoSoftShadow,
  },
  activeAvatar: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  activeText: { flex: 1, minWidth: 0 },
  activeLabel: { color: bento.success, fontSize: 11, fontWeight: "700" },
  activeTitle: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  activeSub: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  activeAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 6,
    height: 34,
    justifyContent: "center",
    width: 34,
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
  sectionTitle: { color: bento.text, fontSize: 17, fontWeight: "700" },
  sectionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderColor: bento.primaryDark,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  createButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  visitCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    flex: 1,
    gap: 13,
    marginBottom: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
    ...bentoSoftShadow,
  },
  visitTop: { alignItems: "center", flexDirection: "row", gap: 11 },
  visitIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  visitMain: { flex: 1, minWidth: 0 },
  visitTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  visitTitle: { color: bento.text, flex: 1, fontSize: 15, fontWeight: "700" },
  visitSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: "700" },
  visitFooter: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  footerMeta: { alignItems: "center", flexDirection: "row", gap: 5 },
  footerText: { color: bento.textSecondary, fontSize: 11, fontWeight: "600" },
  cardAction: {
    alignItems: "center",
    backgroundColor: bento.text,
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cardActionMuted: { backgroundColor: bento.border },
  cardActionText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardActionTextMuted: { color: bento.textSecondary },
  pressed: { opacity: 0.72 },
});
