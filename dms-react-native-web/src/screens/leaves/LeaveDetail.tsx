import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { bento, bentoSoftShadow } from "../../theme";
import type { LeaveRequest } from "../../types/domain";
import { shortDate, shortDateTime, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function LeaveDetail({
  leave,
  onBack,
}: {
  leave: LeaveRequest;
  onBack: () => void;
}) {
  const days = leaveDays(leave);
  const tone = statusTone(leave.status);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
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
            <Text style={styles.title}>Chi tiết nghỉ phép</Text>
          </View>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: tone.color, borderColor: tone.color },
            ]}
          >
            <MaterialCommunityIcons
              name={statusIcon(leave.status)}
              size={21}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: bento.surface,
              borderColor: tone.border,
              borderLeftColor: tone.color,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: tone.color, borderColor: tone.color },
              ]}
            >
              <MaterialCommunityIcons
                name={statusIcon(leave.status)}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={[styles.statusPill, { borderColor: tone.border }]}>
              <Text style={[styles.statusText, { color: tone.color }]}>
                {statusLabel(leave.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.leaveCode}>Mã {shortCode(leave._id)}</Text>
          <Text style={styles.leaveRange}>
            {shortDate(leave.startDate)} - {shortDate(leave.endDate)}
          </Text>
          <Text style={styles.createdAt}>
            Tạo lúc {shortDateTime(leave.createdAt)}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile
            icon="calendar-start-outline"
            label="Bắt đầu"
            value={shortDate(leave.startDate)}
            tone={{ color: "#2563EB", bg: "#EFF6FF" }}
          />
          <InfoTile
            icon="calendar-end-outline"
            label="Kết thúc"
            value={shortDate(leave.endDate)}
            tone={{ color: "#0891B2", bg: "#ECFEFF" }}
          />
          <InfoTile
            icon="calendar-range-outline"
            label="Số ngày"
            value={`${days} ngày`}
            tone={{ color: "#059669", bg: "#ECFDF5" }}
          />
          <InfoTile
            icon="clock-outline"
            label="Cập nhật"
            value={shortDateTime(leave.updatedAt)}
            tone={{ color: "#64748B", bg: "#F8FAFC" }}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon="text-box-outline"
            title="Lý do nghỉ"
            color={bento.primary}
            bg={bento.primarySoft}
          />
          <Text style={styles.reason}>{leave.reason}</Text>
        </View>
        <View style={styles.card}>
          <SectionHeader
            icon="clipboard-check-outline"
            title="Phản hồi duyệt"
            color={tone.color}
            bg={tone.bg}
          />
          <DetailRow label="Trạng thái" value={statusLabel(leave.status)} />
          <DetailRow
            label="Ghi chú quản lý"
            value={leave.adminNote || "Chưa có phản hồi"}
          />
          <DetailRow label="Cập nhật" value={shortDateTime(leave.updatedAt)} />
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
  color,
  bg,
}: {
  icon: IconName;
  title: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: color, borderColor: color },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={19} color="#FFFFFF" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}
function InfoTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: { color: string; bg: string };
}) {
  return (
    <View
      style={[
        styles.infoTile,
        { backgroundColor: bento.surface, borderColor: borderForBg(tone.bg) },
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: tone.color, borderColor: tone.color },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.infoLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
function leaveDays(leave: Pick<LeaveRequest, "startDate" | "endDate">) {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff)) return 0;
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
}
function shortCode(id: string) {
  return id ? `NP${id.slice(-6).toUpperCase()}` : "-";
}
function statusIcon(status: LeaveRequest["status"]): IconName {
  if (status === "approved") return "calendar-check-outline";
  if (status === "rejected") return "calendar-remove-outline";
  return "calendar-clock-outline";
}
function statusTone(status: LeaveRequest["status"]) {
  if (status === "approved")
    return { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (status === "rejected")
    return { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
}
function borderForBg(bg: string) {
  if (bg === bento.primarySoft) return bento.borderStrong;
  if (bg === bento.routeSoft) return "#BAE6FD";
  if (bg === bento.successSoft) return bento.borderStrong;
  if (bg === bento.warningSoft) return "#FED7AA";
  if (bg === bento.dangerSoft) return "#FECACA";
  if (bg === "#EFF6FF") return "#BFDBFE";
  if (bg === "#ECFEFF") return "#A5F3FC";
  if (bg === "#ECFDF5") return "#A7F3D0";
  if (bg === "#FFFBEB") return "#FDE68A";
  if (bg === "#FEF2F2") return "#FECACA";
  if (bg === "#F8FAFC") return "#CBD5E1";
  return bento.border;
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
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  headerIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  heroCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
    ...bentoSoftShadow,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  statusPill: {
    backgroundColor: bento.surface,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  leaveCode: { color: bento.textMuted, fontSize: 11, fontWeight: "700" },
  leaveRange: {
    color: bento.text,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 25,
  },
  createdAt: { color: bento.textSecondary, fontSize: 13, fontWeight: "600" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoTile: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 104,
    padding: 13,
    ...bentoSoftShadow,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  infoValue: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 11,
  },
  infoLabel: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderLeftColor: bento.primary,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 13,
    padding: 15,
    ...bentoSoftShadow,
  },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 10 },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  reason: {
    color: bento.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  detailRow: {
    alignItems: "flex-start",
    borderTopColor: bento.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  detailLabel: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  detailValue: {
    color: bento.text,
    flex: 1.25,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  pressed: { opacity: 0.72 },
});
