import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner, SuccessBanner, Timeline, TimelineItem } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { RoutePlan, Visit } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import { getCustomerName, shortDateTime, statusLabel } from "../../utils/format";
import { getCurrentPosition, type CurrentPosition } from "./visitLocation";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

export function VisitDetail({ visit, onBack, onChanged }: { visit: Visit; onBack: () => void; onChanged: (visit: Visit) => void }) {
  const [note, setNote] = useState("");
  const [checkOutLatitude, setCheckOutLatitude] = useState("");
  const [checkOutLongitude, setCheckOutLongitude] = useState("");
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isActive = visit.status === "checked_in";
  const tone = isActive ? toneColors("blue") : toneColors("success");

  const fillCurrentLocation = async () => {
    setGettingLocation(true);
    setError("");
    try {
      const currentPosition = await getCurrentPosition();
      setPosition(currentPosition);
      setCheckOutLatitude(String(currentPosition.latitude));
      setCheckOutLongitude(String(currentPosition.longitude));
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không lấy được vị trí hiện tại"));
    } finally {
      setGettingLocation(false);
    }
  };

  const checkOut = async () => {
    const latitude = parseCoordinate(checkOutLatitude);
    const longitude = parseCoordinate(checkOutLongitude);
    if (latitude === undefined || longitude === undefined) {
      setError("Vui lòng lấy tọa độ GPS trước khi check-out.");
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Tọa độ GPS không nằm trong phạm vi hợp lệ.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const updated = await sellerApi.checkOut(visit._id, { checkOutLatitude: latitude, checkOutLongitude: longitude, note: note.trim() || undefined });
      onChanged(updated);
      setNote("");
      setCheckOutLatitude("");
      setCheckOutLongitude("");
      setPosition(null);
      setMessage("Đã check-out lượt ghé.");
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không check-out được"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Visit detail</Text>
            <Text style={styles.title}>Chi tiết ghé thăm</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            <MaterialCommunityIcons name={isActive ? "map-marker-radius-outline" : "check-circle-outline"} size={21} color={tone.text} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.customerBadge}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color={bento.primaryDark} />
            </View>
            <View style={[styles.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(visit.status)}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{getCustomerName(visit.customer)}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>{getRouteName(visit.route)}</Text>
          <View style={styles.heroStats}>
            <HeroMetric label="Check-in" value={shortDateTime(visit.checkInTime)} />
            <HeroMetric label="Check-out" value={visit.checkOutTime ? shortDateTime(visit.checkOutTime) : "Chưa có"} />
          </View>
        </View>

        <ErrorBanner message={error} />
        <SuccessBanner message={message} />

        <View style={styles.card}>
          <SectionTitle icon="timeline-check-outline" title="Timeline lượt ghé" tone="blue" />
          <Timeline>
            <TimelineItem icon="login" color={bento.route} bg={bento.routeSoft} isLast={!visit.checkOutTime}>
              <TimelineContent title="Check-in" meta={shortDateTime(visit.checkInTime)} value={formatCoordinate(visit.checkInLatitude, visit.checkInLongitude)} />
            </TimelineItem>
            {visit.checkOutTime ? (
              <TimelineItem icon="logout" color={bento.success} bg={bento.successSoft} isLast>
                <TimelineContent title="Check-out" meta={shortDateTime(visit.checkOutTime)} value={formatCoordinate(visit.checkOutLatitude, visit.checkOutLongitude)} />
              </TimelineItem>
            ) : null}
          </Timeline>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile icon="login" label="GPS check-in" value={formatCoordinate(visit.checkInLatitude, visit.checkInLongitude)} tone="blue" />
          <InfoTile icon="logout" label="GPS check-out" value={formatCoordinate(visit.checkOutLatitude, visit.checkOutLongitude)} tone={visit.checkOutTime ? "success" : "muted"} />
          <InfoTile icon="clock-outline" label="Thời gian vào" value={shortDateTime(visit.checkInTime)} tone="primary" />
          <InfoTile icon="note-text-outline" label="Ghi chú" value={visit.note || "-"} tone="warning" />
        </View>

        <View style={styles.card}>
          <SectionTitle icon="clipboard-text-outline" title="Thông tin lượt ghé" tone="primary" />
          <DetailRow label="Khách hàng" value={getCustomerName(visit.customer)} />
          <DetailRow label="Tuyến" value={getRouteName(visit.route)} />
          <DetailRow label="Trạng thái" value={isActive ? "Đang ghé" : "Hoàn tất"} />
          <DetailRow label="Check-in" value={shortDateTime(visit.checkInTime)} />
          <DetailRow label="Check-out" value={shortDateTime(visit.checkOutTime)} />
          <DetailRow label="Ghi chú" value={visit.note || "-"} />
        </View>

        {isActive ? (
          <View style={styles.card}>
            <View style={styles.checkoutHeader}>
              <SectionTitle icon="logout" title="Check-out" tone="warning" />
              <Pressable onPress={fillCurrentLocation} disabled={gettingLocation} style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed, gettingLocation && styles.disabled]}>
                <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#fff" />
                <Text style={styles.gpsButtonText}>{gettingLocation ? "Đang lấy" : "GPS"}</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionHint}>Lấy GPS hiện tại để hoàn tất lượt ghé.</Text>
            {position ? (
              <View style={styles.locationBox}>
                <MaterialCommunityIcons name="map-marker-check-outline" size={18} color={bento.success} />
                <Text style={styles.locationText}>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}{position.accuracy ? ` - sai số ${Math.round(position.accuracy)}m` : ""}</Text>
              </View>
            ) : null}
            <View style={styles.twoCols}>
              <MobileField label="Vĩ độ" value={checkOutLatitude} onChangeText={setCheckOutLatitude} keyboardType="numeric" placeholder="10.762622" />
              <MobileField label="Kinh độ" value={checkOutLongitude} onChangeText={setCheckOutLongitude} keyboardType="numeric" placeholder="106.660172" />
            </View>
            <MobileField label="Ghi chú" value={note} onChangeText={setNote} multiline placeholder="Kết quả trưng bày, đặt hàng, phản hồi..." />
            <Pressable onPress={checkOut} disabled={submitting || !checkOutLatitude || !checkOutLongitude} style={({ pressed }) => [styles.checkoutButton, pressed && styles.pressed, (submitting || !checkOutLatitude || !checkOutLongitude) && styles.disabled]}>
              <MaterialCommunityIcons name="logout" size={20} color="#fff" />
              <Text style={styles.checkoutButtonText}>{submitting ? "Đang xử lý..." : "Xác nhận check-out"}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ icon, title, tone }: { icon: IconName; title: string; tone: ToneName }) {
  const color = toneColors(tone);
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color.text} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.heroMetric}><Text style={styles.heroMetricValue} numberOfLines={1}>{value}</Text><Text style={styles.heroMetricLabel}>{label}</Text></View>;
}

function TimelineContent({ title, meta, value }: { title: string; meta: string; value: string }) {
  return <View style={styles.timelineContentBox}><View style={styles.timelineText}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.timelineMeta}>{meta}</Text></View><Text style={styles.timelineValue} numberOfLines={1}>{value}</Text></View>;
}

function InfoTile({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone: ToneName }) {
  const color = toneColors(tone);
  return <View style={styles.infoTile}><View style={[styles.infoIcon, { backgroundColor: color.bg, borderColor: color.border }]}><MaterialCommunityIcons name={icon} size={18} color={color.text} /></View><Text style={styles.infoValue} numberOfLines={1}>{value}</Text><Text style={styles.infoLabel} numberOfLines={1}>{label}</Text></View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue} numberOfLines={2}>{value}</Text></View>;
}

function MobileField({ label, value, onChangeText, placeholder, keyboardType, multiline }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric"; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, multiline && styles.inputBoxMultiline]}>
        <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline} placeholder={placeholder} placeholderTextColor={bento.textMuted} style={[styles.input, multiline && styles.textArea]} />
      </View>
    </View>
  );
}

function parseCoordinate(value: string) {
  const coordinate = Number(value.trim().replace(",", "."));
  return Number.isFinite(coordinate) ? coordinate : undefined;
}

function formatCoordinate(latitude?: number, longitude?: number) {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) return "-";
  return `${latitude}, ${longitude}`;
}

function getRouteName(route?: string | RoutePlan) {
  if (!route) return "Ngoài tuyến";
  return typeof route === "string" ? route : route.name;
}

function toneColors(tone: ToneName) {
  if (tone === "success") return { text: bento.success, bg: bento.successSoft, border: "#BDEEDB" };
  if (tone === "warning") return { text: bento.warning, bg: bento.warningSoft, border: "#FFE0A8" };
  if (tone === "danger") return { text: bento.danger, bg: bento.dangerSoft, border: "#FFCACA" };
  if (tone === "blue") return { text: bento.route, bg: bento.routeSoft, border: "#CFE0FF" };
  if (tone === "muted") return { text: bento.textSecondary, bg: bento.surfaceAlt, border: bento.border };
  return { text: bento.primaryDark, bg: bento.primarySoft, border: bento.borderStrong };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  title: { color: bento.text, fontSize: 23, fontWeight: "900", marginTop: 2 },
  headerIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  heroCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, gap: 13, padding: 16, ...bentoSoftShadow },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  customerBadge: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  statusText: { fontSize: 11, fontWeight: "900" },
  heroTitle: { color: bento.text, fontSize: 20, fontWeight: "900", lineHeight: 26 },
  heroSub: { color: bento.textSecondary, fontSize: 13, fontWeight: "800" },
  heroStats: { flexDirection: "row", gap: 10 },
  heroMetric: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 15, borderWidth: 1, flex: 1, padding: 12 },
  heroMetricValue: { color: bento.text, fontSize: 13, fontWeight: "900" },
  heroMetricLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "800", marginTop: 4 },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, gap: 13, padding: 15, ...bentoSoftShadow },
  sectionTitleRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  sectionIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  sectionHint: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  timelineContentBox: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 11 },
  timelineText: { flex: 1, minWidth: 0 },
  timelineTitle: { color: bento.text, fontSize: 13, fontWeight: "900" },
  timelineMeta: { color: bento.textSecondary, fontSize: 11, fontWeight: "700", marginTop: 3 },
  timelineValue: { color: bento.primaryDark, fontSize: 12, fontWeight: "900", maxWidth: 180, textAlign: "right" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoTile: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 104, padding: 13, ...bentoSoftShadow },
  infoIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  infoValue: { color: bento.text, fontSize: 13, fontWeight: "900", marginTop: 11 },
  infoLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "800", marginTop: 3 },
  detailRow: { alignItems: "flex-start", borderTopColor: bento.border, borderTopWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingTop: 10 },
  detailLabel: { color: bento.textSecondary, flex: 1, fontSize: 12, fontWeight: "800" },
  detailValue: { color: bento.text, flex: 1.25, fontSize: 13, fontWeight: "900", textAlign: "right" },
  checkoutHeader: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  gpsButton: { alignItems: "center", backgroundColor: bento.text, borderRadius: 999, flexDirection: "row", gap: 5, minHeight: 40, paddingHorizontal: 12 },
  gpsButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  locationBox: { alignItems: "center", backgroundColor: bento.successSoft, borderColor: "#BBF7D0", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  locationText: { color: "#166534", flex: 1, fontSize: 12, fontWeight: "800", lineHeight: 17 },
  twoCols: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 7, minWidth: 0 },
  fieldLabel: { color: bento.text, fontSize: 12, fontWeight: "900" },
  inputBox: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 54, paddingHorizontal: 12 },
  inputBoxMultiline: { justifyContent: "flex-start", minHeight: 96, paddingTop: 12 },
  input: { color: bento.text, fontSize: 14, fontWeight: "800", outlineStyle: "none" as never },
  textArea: { minHeight: 76, textAlignVertical: "top" },
  checkoutButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 15, flexDirection: "row", gap: 9, height: 56, justifyContent: "center" },
  checkoutButtonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
