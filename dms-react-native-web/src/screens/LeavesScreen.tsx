import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { EmptyState, ErrorBanner, Field, LoadingState, PrimaryButton, SuccessBanner } from "../components/Ui";
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

export function LeavesScreen({ onOpenTab }: { onOpenTab: (tab: SellerTab) => void }) {
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
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));

  const leaves = data || [];
  const leavesByDate = useMemo(() => buildLeavesByDate(leaves), [leaves]);
  const stats = useMemo(() => ({ total: leaves.length, pending: leaves.filter((item) => item.status === "pending").length, approved: leaves.filter((item) => item.status === "approved").length, rejected: leaves.filter((item) => item.status === "rejected").length }), [leaves]);
  const filteredLeaves = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return leaves.filter((leave) => {
      if (filter !== "all" && leave.status !== filter) return false;
      if (!keyword) return true;
      return [leave.reason, leave.adminNote, shortDate(leave.startDate), shortDate(leave.endDate)].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [filter, leaves, query]);
  const hasActiveSearch = query.trim().length > 0 || filter !== "all";

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
      await sellerApi.createLeave({ startDate, endDate, reason: trimmedReason });
      setStartDate("");
      setEndDate("");
      setReason("");
      setShowForm(false);
      setFormMessage("Đã gửi đơn nghỉ phép.");
      setActivePicker("start");
      setCalendarMonth(startOfMonth(new Date()));
      await reload();
    } catch (err) {
      setFormError(toVietnameseError(err instanceof Error ? err.message : "Không gửi được đơn nghỉ"));
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
  if (detail) return <LeaveDetail leave={detail} onBack={() => setDetail(null)} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={() => onOpenTab("dashboard")} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} /></Pressable>
          <View style={styles.headerText}><Text style={styles.eyebrow}>LEAVE WORKSPACE</Text><Text style={styles.title}>Nghỉ phép</Text></View>
        </View>

        <View style={styles.statsGrid}>
          <Metric icon="file-document-outline" value={stats.total} label="Tổng" tone={{ color: bento.primary, bg: bento.primarySoft }} />
          <Metric icon="clock-outline" value={stats.pending} label="Chờ duyệt" tone={{ color: bento.warning, bg: bento.warningSoft }} />
          <Metric icon="check-circle-outline" value={stats.approved} label="Đã duyệt" tone={{ color: bento.success, bg: bento.successSoft }} />
          <Metric icon="close-circle-outline" value={stats.rejected} label="Từ chối" tone={{ color: bento.danger, bg: bento.dangerSoft }} />
        </View>

        <View style={styles.card}><CalendarPicker month={calendarMonth} startDate={showForm ? startDate : ""} endDate={showForm ? endDate : ""} activePicker={activePicker} leavesByDate={leavesByDate} selecting={showForm} onChangeMonth={setCalendarMonth} onSelect={(date) => { if (showForm) selectDate(date); else { const leave = leavesByDate[date]?.[0]; if (leave) setDetail(leave); } }} /></View>

        {showForm ? (
          <View style={styles.card}>
            <SectionHeader icon="calendar-edit" title="Đề xuất nghỉ phép" subtitle="Chọn ngày bắt đầu và kết thúc trên lịch phía trên." color={bento.primary} bg={bento.primarySoft} />
            <ErrorBanner message={formError} />
            <SuccessBanner message={formMessage} />
            <View style={styles.dateRow}><DateSelectCard label="Ngày bắt đầu" value={startDate} active={activePicker === "start"} onPress={() => setActivePicker("start")} /><DateSelectCard label="Ngày kết thúc" value={endDate} active={activePicker === "end"} onPress={() => setActivePicker("end")} /></View>
            <Field label="Lý do" value={reason} onChangeText={setReason} placeholder="Nhập lý do nghỉ phép" multiline />
            <PrimaryButton label="Gửi đơn" onPress={submit} loading={submitting} disabled={!startDate || !endDate || !reason} icon="send" />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionTop}><View><Text style={styles.sectionTitle}>Danh sách đơn nghỉ</Text><Text style={styles.sectionHint}>{filteredLeaves.length} kết quả hiển thị</Text></View>{showForm ? null : <Pressable onPress={() => setShowForm(true)} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}><MaterialCommunityIcons name="plus" size={15} color="#fff" /><Text style={styles.createButtonText}>Tạo</Text></Pressable>}</View>
          <View style={styles.searchBox}><MaterialCommunityIcons name="magnify" size={20} color={bento.textMuted} /><TextInput value={query} onChangeText={setQuery} placeholder="Tìm lý do, ghi chú, ngày nghỉ..." placeholderTextColor={bento.textMuted} style={styles.searchInput} /></View>
          <View style={styles.filterTabs}>{FILTERS.map((item) => <Pressable key={item.key} onPress={() => setFilter(item.key)} style={({ pressed }) => [styles.filterChip, filter === item.key && styles.filterChipActive, pressed && styles.pressed]}><Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text></Pressable>)}</View>
          <ErrorBanner message={error} />
          {!showForm ? <SuccessBanner message={formMessage} /> : null}
          {filteredLeaves.length === 0 ? <EmptyState title={leaves.length === 0 ? "Chưa có đơn nghỉ" : "Không tìm thấy đơn nghỉ"} message={leaves.length === 0 ? "Tạo đơn mới khi cần xin nghỉ phép." : hasActiveSearch ? "Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác." : "Hiện chưa có dữ liệu phù hợp để hiển thị."} icon="calendar-plus" actionLabel={leaves.length === 0 && !showForm ? "Tạo đơn nghỉ" : undefined} onAction={leaves.length === 0 && !showForm ? () => setShowForm(true) : undefined} /> : <View style={styles.list}>{filteredLeaves.map((leave) => <LeaveCard key={leave._id} leave={leave} onPress={() => setDetail(leave)} />)}</View>}
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, subtitle, color, bg }: { icon: IconName; title: string; subtitle: string; color: string; bg: string }) { return <View style={styles.sectionHeader}><View style={[styles.sectionIcon, { backgroundColor: bg }]}><MaterialCommunityIcons name={icon} size={19} color={color} /></View><View style={styles.sectionText}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionHint}>{subtitle}</Text></View></View>; }
function Metric({ icon, value, label, tone }: { icon: IconName; value: number; label: string; tone: { color: string; bg: string } }) { return <View style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: tone.bg }]}><MaterialCommunityIcons name={icon} size={18} color={tone.color} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function LeaveCard({ leave, onPress }: { leave: LeaveRequest; onPress: () => void }) { const days = leaveDays(leave); const tone = statusTone(leave.status); return <Pressable onPress={onPress} style={({ pressed }) => [styles.leaveCard, pressed && styles.pressed]}><View style={styles.leaveTop}><View style={[styles.leaveIcon, { backgroundColor: tone.bg }]}><MaterialCommunityIcons name={leaveIcon(leave.status)} size={21} color={tone.color} /></View><View style={styles.leaveMain}><View style={styles.leaveTitleRow}><Text style={styles.leaveTitle} numberOfLines={1}>{shortDate(leave.startDate)} - {shortDate(leave.endDate)}</Text><View style={[styles.statusPill, { backgroundColor: tone.bg }]}><Text style={[styles.statusText, { color: tone.color }]}>{statusLabel(leave.status)}</Text></View></View><Text style={styles.leaveSubtitle} numberOfLines={2}>{leave.reason}</Text></View></View><View style={styles.leaveFooter}><View style={styles.footerMeta}><MaterialCommunityIcons name="calendar-range-outline" size={14} color={bento.textSecondary} /><Text style={styles.footerText}>{days} ngày</Text></View><View style={styles.footerMeta}><MaterialCommunityIcons name="clock-outline" size={14} color={bento.textSecondary} /><Text style={styles.footerText}>Tạo {shortDateTime(leave.createdAt)}</Text></View></View></Pressable>; }
function DateSelectCard({ label, value, active, onPress }: { label: string; value: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.dateCard, active && styles.dateCardActive, pressed && styles.pressed]}><Text style={[styles.dateLabel, active && styles.dateLabelActive]}>{label}</Text><Text style={styles.dateValue}>{value ? shortDate(value) : "Chọn ngày"}</Text></Pressable>; }

function CalendarPicker({ month, startDate, endDate, activePicker, leavesByDate, selecting, onChangeMonth, onSelect }: { month: Date; startDate: string; endDate: string; activePicker: DateTarget; leavesByDate: Record<string, LeaveRequest[]>; selecting: boolean; onChangeMonth: (date: Date) => void; onSelect: (date: string) => void }) {
  const days = useMemo(() => calendarDays(month), [month]);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)), [days]);
  const monthTitle = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(month);
  return <View style={styles.calendar}><View style={styles.calendarHeader}><Pressable onPress={() => onChangeMonth(addMonths(month, -1))} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}><MaterialCommunityIcons name="chevron-left" size={22} color={bento.text} /></Pressable><View style={styles.monthTitleWrap}><Text style={styles.monthTitle}>{monthTitle}</Text><Text style={styles.monthHint}>{selecting ? `Đang chọn ${activePicker === "start" ? "ngày bắt đầu" : "ngày kết thúc"}` : "Ngày có đơn nghỉ được đánh dấu trên lịch"}</Text></View><Pressable onPress={() => onChangeMonth(addMonths(month, 1))} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}><MaterialCommunityIcons name="chevron-right" size={22} color={bento.text} /></Pressable></View><View style={styles.weekGrid}>{weekDays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View><View style={styles.dayGrid}>{weeks.map((week, weekIndex) => <View key={`week-${weekIndex}`} style={styles.dayWeek}>{week.map((item) => { const isSelected = item.key === startDate || item.key === endDate; const inRange = Boolean(startDate && endDate && item.key >= startDate && item.key <= endDate); const leavesOnDate = leavesByDate[item.key] || []; const leave = leavesOnDate[0]; const hasLeave = leavesOnDate.length > 0; const leaveTone = hasLeave ? statusTone(leave.status) : undefined; return <Pressable key={item.key} onPress={() => onSelect(item.key)} style={({ pressed }) => [styles.dayCell, !item.inMonth && styles.dayCellMuted, hasLeave && { backgroundColor: leaveTone?.bg, borderColor: leaveTone?.color, borderWidth: 1 }, inRange && styles.dayCellRange, isSelected && styles.dayCellSelected, pressed && styles.pressed]}><Text style={[styles.dayText, !item.inMonth && styles.dayTextMuted, hasLeave && { color: leaveTone?.color }, isSelected && styles.dayTextSelected]}>{item.date.getDate()}</Text>{hasLeave ? <View style={[styles.leaveDot, { backgroundColor: leaveTone?.color }]} /> : null}</Pressable>; })}</View>)}</View><View style={styles.calendarLegend}><LegendItem color={bento.warning} label="Chờ duyệt" /><LegendItem color={bento.success} label="Đã duyệt" /><LegendItem color={bento.danger} label="Từ chối" /></View></View>;
}
function LegendItem({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }
function leaveIcon(status: LeaveRequest["status"]): IconName { if (status === "approved") return "calendar-check-outline"; if (status === "rejected") return "calendar-remove-outline"; return "calendar-clock-outline"; }
function statusTone(status: LeaveRequest["status"]) { if (status === "approved") return { color: bento.success, bg: bento.successSoft }; if (status === "rejected") return { color: bento.danger, bg: bento.dangerSoft }; return { color: bento.warning, bg: bento.warningSoft }; }
function leaveDays(leave: Pick<LeaveRequest, "startDate" | "endDate">) { const start = new Date(leave.startDate); const end = new Date(leave.endDate); const diff = end.getTime() - start.getTime(); if (Number.isNaN(diff)) return 0; return Math.max(1, Math.ceil(diff / 86400000) + 1); }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function toDateKey(date: Date) { const year = date.getFullYear(); const month = `${date.getMonth() + 1}`.padStart(2, "0"); const day = `${date.getDate()}`.padStart(2, "0"); return `${year}-${month}-${day}`; }
function calendarDays(month: Date) { const first = startOfMonth(month); const mondayOffset = (first.getDay() + 6) % 7; const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - mondayOffset); return Array.from({ length: 42 }, (_, index) => { const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index); return { date, inMonth: date.getMonth() === month.getMonth(), key: toDateKey(date) }; }); }
function buildLeavesByDate(leaves: LeaveRequest[]) { return leaves.reduce<Record<string, LeaveRequest[]>>((map, leave) => { const start = new Date(leave.startDate); const end = new Date(leave.endDate); if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return map; const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate()); const last = new Date(end.getFullYear(), end.getMonth(), end.getDate()); while (cursor.getTime() <= last.getTime()) { const key = toDateKey(cursor); map[key] = [...(map[key] || []), leave]; cursor.setDate(cursor.getDate() + 1); } return map; }, {}); }

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 }, scrollContent: { minHeight: "100%", paddingBottom: 24 }, page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 }, headerButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow }, headerAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 14, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow }, headerText: { flex: 1, minWidth: 0 }, eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" }, title: { color: bento.text, fontSize: 24, fontWeight: "900", marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: 9 }, metricCard: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flex: 1, minWidth: 0, paddingHorizontal: 6, paddingVertical: 12, ...bentoSoftShadow }, metricIcon: { alignItems: "center", borderRadius: 12, height: 34, justifyContent: "center", width: 34 }, metricValue: { color: bento.text, fontSize: 18, fontWeight: "900", marginTop: 8 }, metricLabel: { color: bento.textSecondary, fontSize: 10, fontWeight: "800", marginTop: 2, textAlign: "center" },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, gap: 13, padding: 15, ...bentoSoftShadow }, sectionHeader: { alignItems: "center", flexDirection: "row", gap: 11 }, sectionIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 }, sectionText: { flex: 1, minWidth: 0 }, sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" }, sectionHint: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 }, sectionTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, dateCard: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flex: 1, minWidth: 140, padding: 12 }, dateCardActive: { backgroundColor: bento.primarySoft, borderColor: bento.primary }, dateLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" }, dateLabelActive: { color: bento.primary }, dateValue: { color: bento.text, fontSize: 15, fontWeight: "900", marginTop: 4 },
  createButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 999, flexDirection: "row", gap: 6, paddingHorizontal: 14, paddingVertical: 10 }, createButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" }, searchBox: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 50, paddingHorizontal: 13 }, searchInput: { color: bento.text, flex: 1, fontSize: 14, fontWeight: "800", minWidth: 0, outlineStyle: "none" as never }, filterTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, filterChip: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, filterChipActive: { backgroundColor: bento.text, borderColor: bento.text }, filterText: { color: bento.textSecondary, fontSize: 12, fontWeight: "900" }, filterTextActive: { color: "#fff" },
  list: { gap: 12, paddingBottom: 4 }, leaveCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, gap: 13, padding: 14, ...bentoSoftShadow }, leaveTop: { alignItems: "center", flexDirection: "row", gap: 12 }, leaveIcon: { alignItems: "center", borderRadius: 15, height: 48, justifyContent: "center", width: 48 }, leaveMain: { flex: 1, minWidth: 0 }, leaveTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 }, leaveTitle: { color: bento.text, flex: 1, fontSize: 16, fontWeight: "900" }, leaveSubtitle: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 5 }, statusPill: { borderRadius: 999, maxWidth: 118, paddingHorizontal: 8, paddingVertical: 5 }, statusText: { fontSize: 10, fontWeight: "900" }, leaveFooter: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: 10 }, footerMeta: { alignItems: "center", flexDirection: "row", gap: 5 }, footerText: { color: bento.textSecondary, fontSize: 11, fontWeight: "800" }, cardAction: { alignItems: "center", backgroundColor: bento.text, borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 7 }, cardActionText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  calendar: { gap: 12 }, calendarHeader: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" }, monthButton: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderRadius: 12, height: 40, justifyContent: "center", width: 40 }, monthTitleWrap: { alignItems: "center", flex: 1, minWidth: 0 }, monthTitle: { color: bento.text, fontSize: 16, fontWeight: "900", textTransform: "capitalize" }, monthHint: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 2, textAlign: "center" }, weekGrid: { flexDirection: "row", gap: 6 }, weekDay: { color: bento.textMuted, flex: 1, fontSize: 12, fontWeight: "900", textAlign: "center" }, dayGrid: { gap: 6 }, dayWeek: { flexDirection: "row", gap: 6 }, dayCell: { alignItems: "center", aspectRatio: 1, backgroundColor: bento.surfaceAlt, borderRadius: 12, flex: 1, justifyContent: "center" }, dayCellMuted: { backgroundColor: "transparent" }, dayCellRange: { backgroundColor: bento.primarySoft }, dayCellSelected: { backgroundColor: bento.primary, ...bentoSoftShadow }, dayText: { color: bento.text, fontSize: 13, fontWeight: "900" }, dayTextMuted: { color: bento.textMuted }, dayTextSelected: { color: "#fff" }, leaveDot: { borderRadius: 3, bottom: 5, height: 5, position: "absolute", width: 5 }, calendarLegend: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }, legendItem: { alignItems: "center", flexDirection: "row", gap: 6 }, legendDot: { borderRadius: 4, height: 8, width: 8 }, legendText: { color: bento.textSecondary, fontSize: 12, fontWeight: "800" }, pressed: { opacity: 0.72 },
});
