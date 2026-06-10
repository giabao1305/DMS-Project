import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import {
  EmptyState,
  ErrorBanner,
  Field,
  LoadingState,
  PrimaryButton,
  SuccessBanner,
  SummaryMetric,
  SummaryStrip,
} from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import { bento, bentoSoftShadow } from "../theme";
import type { LeaveRequest } from "../types/domain";
import { toVietnameseError } from "../utils/errorMessage";
import { shortDate, shortDateTime, statusLabel } from "../utils/format";
import { LeaveDetail } from "./leaves/LeaveDetail";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type DateTarget = "start" | "end";
type LeaveFilter = "all" | "pending" | "approved" | "rejected";

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const FILTERS: { key: LeaveFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Từ chối" },
];

export function LeavesScreen({
  onOpenTab,
}: {
  onOpenTab: (tab: SellerTab) => void;
}) {
  const { data, loading, error, reload } = useResource(sellerApi.leaves, []);
  useRegisterRefresh(reload, [reload]);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<LeaveRequest | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeaveFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activePicker, setActivePicker] = useState<DateTarget>("start");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const leaves = data || [];
  const leavesByDate = useMemo(() => buildLeavesByDate(leaves), [leaves]);
  const filteredLeaves = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return leaves.filter((leave) => {
      if (filter !== "all" && leave.status !== filter) return false;
      if (!keyword) return true;
      return [
        leave.reason,
        leave.adminNote,
        shortDate(leave.startDate),
        shortDate(leave.endDate),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [filter, leaves, query]);
  const hasActiveSearch = query.trim().length > 0 || filter !== "all";
  const pendingCount = leaves.filter(
    (leave) => leave.status === "pending",
  ).length;
  const approvedCount = leaves.filter(
    (leave) => leave.status === "approved",
  ).length;
  const approvedDays = leaves
    .filter((leave) => leave.status === "approved")
    .reduce((sum, leave) => sum + leaveDays(leave), 0);

  const submit = async () => {
    setSubmitting(true);
    setFormError("");
    setFormMessage("");
    try {
      const trimmedReason = reason.trim();
      if (!startDate || !endDate || !trimmedReason) {
        setFormError("Vui lòng chọn ngày nghỉ và nhập lý do.");
        return;
      }
      if (startDate && endDate && startDate > endDate) {
        setFormError("Ngày kết thúc không được trước ngày bắt đầu.");
        return;
      }
      await sellerApi.createLeave({
        startDate,
        endDate,
        reason: trimmedReason,
      });
      setStartDate("");
      setEndDate("");
      setReason("");
      setShowForm(false);
      setFormMessage("Đã gửi đơn nghỉ phép.");
      setActivePicker("start");
      setCalendarMonth(startOfMonth(new Date()));
      await reload();
    } catch (err) {
      setFormError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không gửi được đơn nghỉ",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectDate = (date: string) => {
    if (activePicker === "start") {
      setStartDate(date);
      if (!endDate || date > endDate) setEndDate(date);
      setActivePicker("end");
      return;
    }
    setEndDate(date);
    if (startDate && date < startDate) setStartDate(date);
  };

  if (loading) return <LoadingState />;
  if (detail)
    return <LeaveDetail leave={detail} onBack={() => setDetail(null)} />;

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
              styles.headerButton,
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
            <Text style={styles.title}>Nghỉ phép</Text>
          </View>
        </View>

        <SummaryStrip>
          <SummaryMetric
            label="Chờ duyệt"
            value={pendingCount}
            icon="calendar-clock-outline"
            tone="warning"
          />
          <SummaryMetric
            label="Đã duyệt"
            value={approvedCount}
            icon="calendar-check-outline"
            tone="success"
          />
          <SummaryMetric
            label="Ngày nghỉ"
            value={approvedDays}
            icon="calendar-range-outline"
            tone="blue"
          />
        </SummaryStrip>

        <View style={styles.card}>
          <CalendarPicker
            month={calendarMonth}
            startDate={showForm ? startDate : ""}
            endDate={showForm ? endDate : ""}
            activePicker={activePicker}
            leavesByDate={leavesByDate}
            selecting={showForm}
            onChangeMonth={setCalendarMonth}
            onSelect={(date) => {
              if (showForm) selectDate(date);
              else {
                const leave = leavesByDate[date]?.[0];
                if (leave) setDetail(leave);
              }
            }}
          />
        </View>

        {showForm ? (
          <View style={styles.card}>
            <SectionHeader
              icon="calendar-edit"
              title="Đề xuất nghỉ phép"
              subtitle="Chọn ngày bắt đầu và kết thúc trên lịch phía trên."
              color={bento.primary}
              bg={bento.primarySoft}
            />
            <ErrorBanner message={formError} />
            <SuccessBanner message={formMessage} />
            <View style={styles.dateRow}>
              <DateSelectCard
                label="Ngày bắt đầu"
                value={startDate}
                active={activePicker === "start"}
                onPress={() => setActivePicker("start")}
              />
              <DateSelectCard
                label="Ngày kết thúc"
                value={endDate}
                active={activePicker === "end"}
                onPress={() => setActivePicker("end")}
              />
            </View>
            <Field
              label="Lý do"
              value={reason}
              onChangeText={setReason}
              placeholder="Nhập lý do nghỉ phép"
              multiline
            />
            <PrimaryButton
              label="Gửi đơn"
              onPress={submit}
              loading={submitting}
              disabled={!startDate || !endDate || !reason}
              icon="send"
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionTitle}>Danh sách đơn nghỉ</Text>
              <Text style={styles.sectionHint}>
                {filteredLeaves.length} kết quả hiển thị
              </Text>
            </View>
            {showForm ? null : (
              <Pressable
                onPress={() => setShowForm(true)}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons name="plus" size={15} color="#fff" />
                <Text style={styles.createButtonText}>Tạo</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={bento.textMuted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm lý do, ghi chú, ngày nghỉ..."
              placeholderTextColor={bento.textMuted}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.filterTabs}>
            {FILTERS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  filter === item.key && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item.key && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <ErrorBanner message={error} />
          {!showForm ? <SuccessBanner message={formMessage} /> : null}
          {filteredLeaves.length === 0 ? (
            <EmptyState
              title={
                leaves.length === 0
                  ? "Chưa có đơn nghỉ"
                  : "Không tìm thấy đơn nghỉ"
              }
              message={
                leaves.length === 0
                  ? "Tạo đơn mới khi cần xin nghỉ phép."
                  : hasActiveSearch
                    ? "Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác."
                    : "Hiện chưa có dữ liệu phù hợp để hiển thị."
              }
              icon="calendar-plus"
              actionLabel={
                leaves.length === 0 && !showForm ? "Tạo đơn nghỉ" : undefined
              }
              onAction={
                leaves.length === 0 && !showForm
                  ? () => setShowForm(true)
                  : undefined
              }
            />
          ) : (
            <View style={styles.list}>
              {filteredLeaves.map((leave) => (
                <LeaveCard
                  key={leave._id}
                  leave={leave}
                  onPress={() => setDetail(leave)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  color,
  bg,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={19} color="#FFFFFF" />
      </View>
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionHint}>{subtitle}</Text>
      </View>
    </View>
  );
}
function LeaveCard({
  leave,
  onPress,
}: {
  leave: LeaveRequest;
  onPress: () => void;
}) {
  const days = leaveDays(leave);
  const tone = statusTone(leave.status);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.leaveCard,
        {
          backgroundColor: bento.surface,
          borderColor: tone.color,
          borderLeftColor: tone.color,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.leaveTop}>
        <View
          style={[
            styles.leaveIcon,
            { backgroundColor: tone.color, borderColor: tone.color },
          ]}
        >
          <MaterialCommunityIcons
            name={leaveIcon(leave.status)}
            size={21}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.leaveMain}>
          <View style={styles.leaveTitleRow}>
            <Text style={styles.leaveTitle} numberOfLines={1}>
              {shortDate(leave.startDate)} - {shortDate(leave.endDate)}
            </Text>
            <View
              style={[styles.statusPill, { backgroundColor: bento.surface }]}
            >
              <Text style={[styles.statusText, { color: tone.color }]}>
                {statusLabel(leave.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.leaveSubtitle} numberOfLines={2}>
            {leave.reason}
          </Text>
        </View>
      </View>
      <View style={styles.leaveFooter}>
        <View style={styles.footerMeta}>
          <MaterialCommunityIcons
            name="calendar-range-outline"
            size={14}
            color={bento.textSecondary}
          />
          <Text style={styles.footerText}>{days} ngày</Text>
        </View>
        <View style={styles.footerMeta}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={bento.textSecondary}
          />
          <Text style={styles.footerText}>
            Tạo {shortDateTime(leave.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
function DateSelectCard({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dateCard,
        active && styles.dateCardActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.dateLabel, active && styles.dateLabelActive]}>
        {label}
      </Text>
      <Text style={styles.dateValue}>
        {value ? shortDate(value) : "Chọn ngày"}
      </Text>
    </Pressable>
  );
}

function CalendarPicker({
  month,
  startDate,
  endDate,
  activePicker,
  leavesByDate,
  selecting,
  onChangeMonth,
  onSelect,
}: {
  month: Date;
  startDate: string;
  endDate: string;
  activePicker: DateTarget;
  leavesByDate: Record<string, LeaveRequest[]>;
  selecting: boolean;
  onChangeMonth: (date: Date) => void;
  onSelect: (date: string) => void;
}) {
  const days = useMemo(() => calendarDays(month), [month]);
  const weeks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) =>
        days.slice(index * 7, index * 7 + 7),
      ),
    [days],
  );
  const monthTitle = new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(month);
  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <Pressable
          onPress={() => onChangeMonth(addMonths(month, -1))}
          style={({ pressed }) => [
            styles.monthButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={bento.text}
          />
        </Pressable>
        <View style={styles.monthTitleWrap}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Text style={styles.monthHint}>
            {selecting
              ? `Đang chọn ${activePicker === "start" ? "ngày bắt đầu" : "ngày kết thúc"}`
              : "Ngày có đơn nghỉ được đánh dấu trên lịch"}
          </Text>
        </View>
        <Pressable
          onPress={() => onChangeMonth(addMonths(month, 1))}
          style={({ pressed }) => [
            styles.monthButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={bento.text}
          />
        </Pressable>
      </View>
      <View style={styles.weekGrid}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.dayGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.dayWeek}>
            {week.map((item) => {
              const isSelected = item.key === startDate || item.key === endDate;
              const inRange = Boolean(
                startDate &&
                endDate &&
                item.key >= startDate &&
                item.key <= endDate,
              );
              const leavesOnDate = leavesByDate[item.key] || [];
              const leave = leavesOnDate[0];
              const hasLeave = leavesOnDate.length > 0;
              const leaveTone = hasLeave ? statusTone(leave.status) : undefined;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => onSelect(item.key)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    !item.inMonth && styles.dayCellMuted,
                    hasLeave && {
                      backgroundColor: leaveTone?.bg,
                      borderColor: leaveTone?.color,
                      borderWidth: 1,
                    },
                    inRange && styles.dayCellRange,
                    isSelected && styles.dayCellSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !item.inMonth && styles.dayTextMuted,
                      hasLeave && { color: leaveTone?.color },
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {item.date.getDate()}
                  </Text>
                  {hasLeave ? (
                    <View
                      style={[
                        styles.leaveDot,
                        { backgroundColor: leaveTone?.color },
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.calendarLegend}>
        <LegendItem color={bento.warning} label="Chờ duyệt" />
        <LegendItem color="#059669" label="Đã duyệt" />
        <LegendItem color={bento.danger} label="Từ chối" />
      </View>
    </View>
  );
}
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
function leaveIcon(status: LeaveRequest["status"]): IconName {
  if (status === "approved") return "calendar-check-outline";
  if (status === "rejected") return "calendar-remove-outline";
  return "calendar-clock-outline";
}
function statusTone(status: LeaveRequest["status"]) {
  if (status === "approved")
    return { color: "#059669", bg: "#ECFDF5" };
  if (status === "rejected")
    return { color: "#DC2626", bg: "#FEF2F2" };
  return { color: "#D97706", bg: "#FFFBEB" };
}
function leaveDays(leave: Pick<LeaveRequest, "startDate" | "endDate">) {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function calendarDays(month: Date) {
  const first = startOfMonth(month);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(
    first.getFullYear(),
    first.getMonth(),
    first.getDate() - mondayOffset,
  );
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
    return {
      date,
      inMonth: date.getMonth() === month.getMonth(),
      key: toDateKey(date),
    };
  });
}
function buildLeavesByDate(leaves: LeaveRequest[]) {
  return leaves.reduce<Record<string, LeaveRequest[]>>((map, leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return map;
    const cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor.getTime() <= last.getTime()) {
      const key = toDateKey(cursor);
      map[key] = [...(map[key] || []), leave];
      cursor.setDate(cursor.getDate() + 1);
    }
    return map;
  }, {});
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
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
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 13,
    padding: 15,
    ...bentoSoftShadow,
  },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  sectionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  sectionTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dateCard: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
    padding: 12,
  },
  dateCardActive: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.primary,
  },
  dateLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "600" },
  dateLabelActive: { color: bento.primary },
  dateValue: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderColor: bento.primaryDark,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  searchBox: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 50,
    paddingHorizontal: 13,
    ...bentoSoftShadow,
  },
  searchInput: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 0,
    outlineStyle: "none" as never,
  },
  filterTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: bento.primary,
    borderColor: bento.primary,
  },
  filterText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#fff" },
  list: { gap: 12, paddingBottom: 4 },
  leaveCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...bentoSoftShadow,
  },
  leaveTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  leaveIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  leaveMain: { flex: 1, minWidth: 0 },
  leaveTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  leaveTitle: { color: bento.text, flex: 1, fontSize: 16, fontWeight: "700" },
  leaveSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  statusPill: {
    borderRadius: 6,
    maxWidth: 118,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  leaveFooter: {
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
    borderRadius: 6,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cardActionText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  calendar: { gap: 12 },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  monthTitleWrap: { alignItems: "center", flex: 1, minWidth: 0 },
  monthTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  monthHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  weekGrid: { flexDirection: "row", gap: 6 },
  weekDay: {
    color: bento.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  dayGrid: { gap: 6 },
  dayWeek: { flexDirection: "row", gap: 6 },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  dayCellMuted: { backgroundColor: "transparent" },
  dayCellRange: { backgroundColor: bento.primarySoft },
  dayCellSelected: { backgroundColor: bento.primary, ...bentoSoftShadow },
  dayText: { color: bento.text, fontSize: 13, fontWeight: "700" },
  dayTextMuted: { color: bento.textMuted },
  dayTextSelected: { color: "#fff" },
  leaveDot: {
    borderRadius: 3,
    bottom: 5,
    height: 5,
    position: "absolute",
    width: 5,
  },
  calendarLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 6 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendText: { color: bento.textSecondary, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.72 },
});
