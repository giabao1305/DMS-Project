import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { bento, bentoSoftShadow } from "../../theme";
import type { LeaveRequest } from "../../types/domain";
import { shortDate, shortDateTime, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function LeaveDetail({ leave, onBack }: { leave: LeaveRequest; onBack: () => void }) {
  const days = leaveDays(leave);
  const tone = statusTone(leave.status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} /></Pressable>
          <View style={styles.headerText}><Text style={styles.eyebrow}>LEAVE REQUEST</Text><Text style={styles.title}>Chi tiết nghỉ phép</Text></View>
          <View style={[styles.headerIcon, { backgroundColor: tone.bg }]}><MaterialCommunityIcons name={statusIcon(leave.status)} size={21} color={tone.color} /></View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}><View style={[styles.heroIcon, { backgroundColor: tone.bg }]}><MaterialCommunityIcons name={statusIcon(leave.status)} size={28} color={tone.color} /></View><View style={[styles.statusPill, { backgroundColor: tone.bg }]}><Text style={[styles.statusText, { color: tone.color }]}>{statusLabel(leave.status)}</Text></View></View>
          <Text style={styles.leaveCode}>Mã {shortCode(leave._id)}</Text>
          <Text style={styles.leaveRange}>{shortDate(leave.startDate)} - {shortDate(leave.endDate)}</Text>
          <Text style={styles.createdAt}>Tạo lúc {shortDateTime(leave.createdAt)}</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile icon="calendar-start-outline" label="Bắt đầu" value={shortDate(leave.startDate)} tone={{ color: bento.primary, bg: bento.primarySoft }} />
          <InfoTile icon="calendar-end-outline" label="Kết thúc" value={shortDate(leave.endDate)} tone={{ color: bento.route, bg: bento.routeSoft }} />
          <InfoTile icon="calendar-range-outline" label="Số ngày" value={`${days} ngày`} tone={{ color: bento.success, bg: bento.successSoft }} />
          <InfoTile icon="clock-outline" label="Cập nhật" value={shortDateTime(leave.updatedAt)} tone={{ color: bento.textSecondary, bg: bento.surfaceAlt }} />
        </View>

        <View style={styles.card}><SectionHeader icon="text-box-outline" title="Lý do nghỉ" color={bento.primary} bg={bento.primarySoft} /><Text style={styles.reason}>{leave.reason}</Text></View>
        <View style={styles.card}><SectionHeader icon="clipboard-check-outline" title="Phản hồi duyệt" color={tone.color} bg={tone.bg} /><DetailRow label="Trạng thái" value={statusLabel(leave.status)} /><DetailRow label="Ghi chú quản lý" value={leave.adminNote || "Chưa có phản hồi"} /><DetailRow label="Cập nhật" value={shortDateTime(leave.updatedAt)} /></View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, color, bg }: { icon: IconName; title: string; color: string; bg: string }) { return <View style={styles.sectionHeader}><View style={[styles.sectionIcon, { backgroundColor: bg }]}><MaterialCommunityIcons name={icon} size={19} color={color} /></View><Text style={styles.sectionTitle}>{title}</Text></View>; }
function InfoTile({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone: { color: string; bg: string } }) { return <View style={styles.infoTile}><View style={[styles.infoIcon, { backgroundColor: tone.bg }]}><MaterialCommunityIcons name={icon} size={18} color={tone.color} /></View><Text style={styles.infoValue} numberOfLines={1}>{value}</Text><Text style={styles.infoLabel} numberOfLines={1}>{label}</Text></View>; }
function DetailRow({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue} numberOfLines={2}>{value}</Text></View>; }
function leaveDays(leave: Pick<LeaveRequest, "startDate" | "endDate">) { const start = new Date(leave.startDate); const end = new Date(leave.endDate); const diff = end.getTime() - start.getTime(); if (Number.isNaN(diff)) return 0; return Math.max(1, Math.ceil(diff / 86400000) + 1); }
function shortCode(id: string) { return id ? `NP${id.slice(-6).toUpperCase()}` : "-"; }
function statusIcon(status: LeaveRequest["status"]): IconName { if (status === "approved") return "calendar-check-outline"; if (status === "rejected") return "calendar-remove-outline"; return "calendar-clock-outline"; }
function statusTone(status: LeaveRequest["status"]) { if (status === "approved") return { color: bento.success, bg: bento.successSoft }; if (status === "rejected") return { color: bento.danger, bg: bento.dangerSoft }; return { color: bento.warning, bg: bento.warningSoft }; }

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 }, scrollContent: { minHeight: "100%", paddingBottom: 24 }, page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 }, headerButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow }, headerText: { flex: 1, minWidth: 0 }, eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" }, title: { color: bento.text, fontSize: 23, fontWeight: "900", marginTop: 2 }, headerIcon: { alignItems: "center", borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  heroCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, gap: 8, padding: 14, ...bentoSoftShadow }, heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, heroIcon: { alignItems: "center", borderRadius: 13, height: 44, justifyContent: "center", width: 44 }, statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, statusText: { fontSize: 11, fontWeight: "900" }, leaveCode: { color: bento.textMuted, fontSize: 11, fontWeight: "900" }, leaveRange: { color: bento.text, fontSize: 20, fontWeight: "900", lineHeight: 25 }, createdAt: { color: bento.textSecondary, fontSize: 13, fontWeight: "800" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, infoTile: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 104, padding: 13, ...bentoSoftShadow }, infoIcon: { alignItems: "center", borderRadius: 13, height: 38, justifyContent: "center", width: 38 }, infoValue: { color: bento.text, fontSize: 14, fontWeight: "900", marginTop: 11 }, infoLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "800", marginTop: 3 },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 16, borderWidth: 1, gap: 13, padding: 15, ...bentoSoftShadow }, sectionHeader: { alignItems: "center", flexDirection: "row", gap: 10 }, sectionIcon: { alignItems: "center", borderRadius: 13, height: 40, justifyContent: "center", width: 40 }, sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" }, reason: { color: bento.textSecondary, fontSize: 14, fontWeight: "700", lineHeight: 22 }, detailRow: { alignItems: "flex-start", borderTopColor: bento.border, borderTopWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingTop: 10 }, detailLabel: { color: bento.textSecondary, flex: 1, fontSize: 12, fontWeight: "800" }, detailValue: { color: bento.text, flex: 1.25, fontSize: 13, fontWeight: "900", textAlign: "right" }, pressed: { opacity: 0.72 },
});
