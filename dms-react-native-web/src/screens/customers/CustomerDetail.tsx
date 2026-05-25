import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner, SuccessBanner, Timeline, TimelineItem } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Customer, Order, Visit } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import { currency, getCustomerId, shortDateTime, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

export function CustomerDetail({
  customer,
  orders,
  visits,
  message,
  onBack,
  onCreateOrder,
  onCreateVisit,
  onEdit,
  onDeleted,
}: {
  customer: Customer;
  orders?: Order[];
  visits?: Visit[];
  message?: string;
  onBack: () => void;
  onCreateOrder?: () => void;
  onCreateVisit?: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const canEdit = customer.status !== "approved";
  const hasGps = Boolean(customer.latitude && customer.longitude);
  const status = statusTone(customer.status);
  const customerOrders = (orders || []).filter((order) => getCustomerId(order.customer) === customer._id);
  const customerVisits = (visits || []).filter((visit) => getCustomerId(visit.customer) === customer._id);
  const salesStats = buildSalesStats(customerOrders, customerVisits);
  const activityItems = buildActivityItems(customerOrders, customerVisits);

  const deleteCustomer = () => {
    Alert.alert("Xóa khách hàng", `Xóa ${customer.name}?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          setError("");
          try {
            await sellerApi.deleteCustomer(customer._id);
            onDeleted();
          } catch (err) {
            setError(toVietnameseError(err instanceof Error ? err.message : "Không xóa được khách hàng"));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Hồ sơ điểm bán</Text>
            <Text style={styles.title}>Chi tiết khách</Text>
          </View>
          {canEdit ? (
            <Pressable onPress={onEdit} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="square-edit-outline" size={20} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View style={[styles.headerStatusIcon, { backgroundColor: status.bg, borderColor: status.border }]}>
              <MaterialCommunityIcons name="check-decagram" size={21} color={status.text} />
            </View>
          )}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{customerInitial(customer)}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.customerCode}>{shortCode(customer._id)}</Text>
              <Text style={styles.customerName} numberOfLines={2}>{customer.name}</Text>
              <Text style={styles.customerType} numberOfLines={1}>{customer.customerType || "Điểm bán"}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{statusLabel(customer.status)}</Text>
            </View>
          </View>
          <View style={styles.addressLine}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={bento.textMuted} />
            <Text style={styles.heroAddress} numberOfLines={2}>{customer.address || "Chưa có địa chỉ"}</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <QuickAction icon="cart-plus" label="Tạo đơn" tone="primary" onPress={onCreateOrder} />
          <QuickAction icon="crosshairs-gps" label="Check-in" tone={hasGps ? "success" : "muted"} onPress={onCreateVisit} disabled={!hasGps} />
          <QuickAction icon="phone-outline" label="Gọi điện" tone={customer.phone ? "blue" : "muted"} onPress={customer.phone ? () => { void Linking.openURL(`tel:${customer.phone}`); } : undefined} disabled={!customer.phone} />
          <QuickAction icon="square-edit-outline" label="Sửa" tone={canEdit ? "warning" : "muted"} onPress={canEdit ? onEdit : undefined} disabled={!canEdit} />
        </View>

        <ErrorBanner message={error} />
        <SuccessBanner message={message} />

        <View style={styles.infoGrid}>
          <InfoTile icon="phone-outline" label="Số điện thoại" value={customer.phone || "Chưa có"} tone="primary" />
          <InfoTile icon="account-outline" label="Phụ trách" value={customer.ownerName || "Chưa có"} tone="muted" />
          <InfoTile icon="tag-outline" label="Nhóm khách" value={customer.customerType || "Chưa phân loại"} tone="blue" />
          <InfoTile icon="power" label="Hoạt động" value={customer.isActive ? "Đang hoạt động" : "Tạm khóa"} tone={customer.isActive ? "success" : "danger"} />
        </View>

        <View style={styles.salesCard}>
          <SectionTitle icon="chart-box-outline" title="Tổng quan bán hàng" tone="primary" />
          <View style={styles.salesGrid}>
            <SalesMetric icon="receipt-text-check-outline" label="Doanh thu" value={currency(salesStats.revenue)} tone="primary" />
            <SalesMetric icon="cart-outline" label="Đơn hàng" value={`${salesStats.orders}`} tone="blue" />
            <SalesMetric icon="map-marker-check-outline" label="Lượt ghé" value={`${salesStats.visits}`} tone="success" />
          </View>
          <View style={styles.nextStepBox}>
            <MaterialCommunityIcons name={salesStats.nextStep.icon} size={20} color={salesStats.nextStep.color} />
            <View style={styles.nextStepText}>
              <Text style={styles.nextStepTitle}>{salesStats.nextStep.title}</Text>
              <Text style={styles.nextStepSubtitle}>{salesStats.nextStep.subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <SectionTitle icon="card-account-details-outline" title="Thông tin chung" tone="primary" />
          <DetailRow label="Mã khách hàng" value={shortCode(customer._id)} />
          <DetailRow label="Loại khách" value={customer.customerType || "Chưa phân loại"} />
          <DetailRow label="Người phụ trách" value={customer.ownerName || "-"} />
          <DetailRow label="Trạng thái" value={statusLabel(customer.status)} />
          <DetailRow label="Hoạt động" value={customer.isActive ? "Đang hoạt động" : "Tạm khóa"} />
        </View>

        <View style={styles.mapCard}>
          <SectionTitle icon="map-marker-radius-outline" title="Địa chỉ & GPS" tone={hasGps ? "success" : "muted"} />
          <Text style={styles.addressBlock}>{customer.address || "Chưa có địa chỉ"}</Text>
          <View style={[styles.mapBox, hasGps && styles.mapBoxActive]}>
            <View style={styles.mapGrid}>
              <View style={styles.mapPinCircle}>
                <MaterialCommunityIcons name={hasGps ? "map-marker-check" : "map-marker-off-outline"} size={31} color={hasGps ? bento.success : bento.textMuted} />
              </View>
              <View style={styles.mapDotOne} />
              <View style={styles.mapDotTwo} />
              <View style={styles.mapDotThree} />
            </View>
            <Text style={styles.mapText}>{hasGps ? `${customer.latitude}, ${customer.longitude}` : "Chưa có GPS"}</Text>
            <Text style={styles.mapSubText}>{hasGps ? "Sẵn sàng phân tuyến và check-in" : "Cập nhật GPS để tối ưu tuyến"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <SectionTitle icon="history" title="Hoạt động gần đây" tone="blue" />
          {activityItems.length === 0 ? (
            <View style={styles.emptyActivity}>
              <MaterialCommunityIcons name="timeline-clock-outline" size={24} color={bento.textMuted} />
              <Text style={styles.emptyActivityTitle}>Chưa có lịch sử bán hàng</Text>
              <Text style={styles.emptyActivityText}>Tạo đơn hoặc check-in để bắt đầu ghi nhận hoạt động của điểm bán.</Text>
            </View>
          ) : (
            <Timeline>
              {activityItems.slice(0, 5).map((item, index) => (
                <TimelineItem key={`${item.type}-${item.id}`} icon={item.icon} color={item.color} bg={item.bg} isLast={index === Math.min(activityItems.length, 5) - 1}>
                  <View style={styles.activityRow}>
                    <View style={styles.activityText}>
                      <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.activityMeta} numberOfLines={1}>{item.meta}</Text>
                    </View>
                    <Text style={styles.activityValue} numberOfLines={1}>{item.value}</Text>
                  </View>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </View>

        <View style={styles.card}>
          <SectionTitle icon="database-clock-outline" title="Hệ thống" tone="blue" />
          <DetailRow label="Tạo lúc" value={shortDateTime(customer.createdAt)} />
          <DetailRow label="Cập nhật" value={shortDateTime(customer.updatedAt)} />
          <DetailRow label="Duyệt lúc" value={shortDateTime(customer.approvedAt)} />
          <DetailRow label="Lý do từ chối" value={customer.rejectReason || "-"} />
        </View>

        <View style={styles.actions}>
          {canEdit ? (
            <Pressable onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="pencil-outline" size={19} color="#FFFFFF" />
              <Text style={styles.editText}>Sửa điểm bán</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={deleteCustomer} disabled={deleting} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed, deleting && styles.disabled]}>
            <MaterialCommunityIcons name="delete-outline" size={19} color={bento.danger} />
            <Text style={styles.deleteText}>{deleting ? "Đang xóa..." : "Xóa"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, tone, disabled, onPress }: { icon: IconName; label: string; tone: ToneName; disabled?: boolean; onPress?: () => void }) {
  const color = toneColors(tone);
  return (
    <Pressable disabled={disabled || !onPress} onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed, (disabled || !onPress) && styles.disabled]}>
      <View style={[styles.quickIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color.text} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
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

function InfoTile({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone: ToneName }) {
  const color = toneColors(tone);
  return (
    <View style={styles.infoTile}>
      <View style={[styles.infoIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color.text} />
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.infoLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SalesMetric({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone: ToneName }) {
  const color = toneColors(tone);
  return (
    <View style={styles.salesMetric}>
      <View style={[styles.salesMetricIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color.text} />
      </View>
      <Text style={styles.salesMetricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.salesMetricLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function buildSalesStats(orders: Order[], visits: Visit[]) {
  const activeOrders = orders.filter((order) => !["cancelled", "returned"].includes(order.status));
  const revenue = activeOrders.reduce((sum, order) => sum + (order.finalAmount || order.totalAmount || 0), 0);
  const lastOrder = newestByDate(orders, (order) => order.createdAt);
  const lastVisit = newestByDate(visits, (visit) => visit.checkInTime || visit.createdAt);
  const nextStep = getNextStep(lastOrder, lastVisit);
  return { orders: orders.length, revenue, visits: visits.length, nextStep };
}

function buildActivityItems(orders: Order[], visits: Visit[]) {
  const orderItems = orders.map((order) => ({
    type: "order",
    id: order._id,
    date: order.createdAt,
    title: order.orderCode || "Đơn hàng",
    meta: `${statusLabel(order.status)} · ${shortDateTime(order.createdAt)}`,
    value: currency(order.finalAmount || order.totalAmount || 0),
    icon: "receipt-text-outline" as IconName,
    color: order.status === "delivered" ? bento.success : order.status === "cancelled" ? bento.danger : bento.primaryDark,
    bg: order.status === "delivered" ? bento.successSoft : order.status === "cancelled" ? bento.dangerSoft : bento.primarySoft,
  }));
  const visitItems = visits.map((visit) => ({
    type: "visit",
    id: visit._id,
    date: visit.checkInTime || visit.createdAt,
    title: visit.status === "checked_out" ? "Đã hoàn tất ghé thăm" : "Đang check-in",
    meta: `${statusLabel(visit.status)} · ${shortDateTime(visit.checkInTime || visit.createdAt)}`,
    value: visit.checkOutTime ? shortDateTime(visit.checkOutTime) : "Đang mở",
    icon: "map-marker-check-outline" as IconName,
    color: visit.status === "checked_out" ? bento.success : bento.route,
    bg: visit.status === "checked_out" ? bento.successSoft : bento.routeSoft,
  }));
  return [...orderItems, ...visitItems].sort((left, right) => getTime(right.date) - getTime(left.date));
}

function newestByDate<T>(items: T[], getDate: (item: T) => string | undefined) {
  return items.reduce<T | undefined>((latest, item) => {
    if (!latest) return item;
    return getTime(getDate(item)) > getTime(getDate(latest)) ? item : latest;
  }, undefined);
}

function getNextStep(lastOrder?: Order, lastVisit?: Visit) {
  if (!lastVisit) {
    return {
      icon: "crosshairs-gps" as IconName,
      color: bento.route,
      title: "Nên check-in lần đầu",
      subtitle: "Điểm bán chưa có lịch sử ghé thăm trong app.",
    };
  }
  if (!lastOrder) {
    return {
      icon: "cart-plus" as IconName,
      color: bento.primaryDark,
      title: "Nên tạo đơn đầu tiên",
      subtitle: `Lần ghé gần nhất: ${shortDateTime(lastVisit.checkInTime || lastVisit.createdAt)}.`,
    };
  }
  if (lastOrder.status === "pending") {
    return {
      icon: "clock-outline" as IconName,
      color: bento.warning,
      title: "Theo dõi đơn đang chờ duyệt",
      subtitle: `${lastOrder.orderCode || "Đơn hàng"} đang ở trạng thái ${statusLabel(lastOrder.status)}.`,
    };
  }
  return {
    icon: "store-check-outline" as IconName,
    color: bento.success,
    title: "Khách hàng đang có lịch sử tốt",
    subtitle: `Đơn gần nhất: ${shortDateTime(lastOrder.createdAt)}.`,
  };
}

function getTime(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function shortCode(id: string) {
  return id ? `KH${id.slice(-6).toUpperCase()}` : "-";
}

function customerInitial(customer: Customer) {
  const source = customer.name || customer.ownerName || "K";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] || ""}`.toUpperCase();
}

function statusTone(status: Customer["status"]) {
  if (status === "approved") return toneColors("success");
  if (status === "rejected") return toneColors("danger");
  return toneColors("warning");
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
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: { alignSelf: "center", gap: 16, maxWidth: 760, paddingHorizontal: 20, paddingTop: 18, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 15, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerStatusIcon: { alignItems: "center", borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "800" },
  title: { color: bento.text, fontSize: 22, fontWeight: "900", marginTop: 2 },
  heroCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  heroTop: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  avatar: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 18, borderWidth: 1, height: 56, justifyContent: "center", width: 56 },
  avatarText: { color: bento.primaryDark, fontSize: 20, fontWeight: "900" },
  heroText: { flex: 1, minWidth: 0 },
  customerCode: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  customerName: { color: bento.text, fontSize: 19, fontWeight: "900", lineHeight: 24, marginTop: 3 },
  customerType: { color: bento.textSecondary, fontSize: 12, fontWeight: "800", marginTop: 4 },
  statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  statusText: { fontSize: 11, fontWeight: "900" },
  addressLine: { alignItems: "flex-start", flexDirection: "row", gap: 7 },
  heroAddress: { color: bento.textSecondary, flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickAction: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 20, borderWidth: 1, flex: 1, gap: 7, minHeight: 82, padding: 10, ...bentoSoftShadow },
  quickIcon: { alignItems: "center", borderRadius: 15, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  quickLabel: { color: bento.text, fontSize: 10, fontWeight: "900", textAlign: "center" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoTile: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 20, borderWidth: 1, flexBasis: "47%", flexGrow: 1, minHeight: 104, padding: 13, ...bentoSoftShadow },
  infoIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  infoValue: { color: bento.text, fontSize: 14, fontWeight: "900", marginTop: 11 },
  infoLabel: { color: bento.textSecondary, fontSize: 11, fontWeight: "800", marginTop: 3 },
  salesCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  salesGrid: { flexDirection: "row", gap: 9 },
  salesMetric: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 18, borderWidth: 1, flex: 1, minWidth: 0, padding: 11 },
  salesMetricIcon: { alignItems: "center", borderRadius: 13, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  salesMetricValue: { color: bento.text, fontSize: 14, fontWeight: "900", marginTop: 9 },
  salesMetricLabel: { color: bento.textSecondary, fontSize: 10, fontWeight: "800", marginTop: 2 },
  nextStepBox: { alignItems: "flex-start", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  nextStepText: { flex: 1, minWidth: 0 },
  nextStepTitle: { color: bento.text, fontSize: 13, fontWeight: "900" },
  nextStepSubtitle: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 2 },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  sectionTitleRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  sectionIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  detailRow: { alignItems: "flex-start", borderTopColor: bento.border, borderTopWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingTop: 11 },
  detailLabel: { color: bento.textSecondary, flex: 1, fontSize: 12, fontWeight: "800" },
  detailValue: { color: bento.text, flex: 1.25, fontSize: 13, fontWeight: "900", textAlign: "right" },
  mapCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  addressBlock: { color: bento.text, fontSize: 14, fontWeight: "800", lineHeight: 21 },
  mapBox: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 20, borderWidth: 1, gap: 7, justifyContent: "center", minHeight: 150, overflow: "hidden", padding: 16, position: "relative" },
  mapBoxActive: { backgroundColor: bento.successSoft, borderColor: "#BDEEDB" },
  mapGrid: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.64)", borderColor: bento.border, borderRadius: 999, borderWidth: 1, height: 74, justifyContent: "center", position: "relative", width: 74 },
  mapPinCircle: { alignItems: "center", backgroundColor: bento.surface, borderRadius: 999, height: 56, justifyContent: "center", width: 56, ...bentoSoftShadow },
  mapDotOne: { backgroundColor: bento.route, borderRadius: 5, height: 10, position: "absolute", right: -24, top: 4, width: 10 },
  mapDotTwo: { backgroundColor: bento.primary, borderRadius: 4, bottom: 10, height: 8, left: -20, position: "absolute", width: 8 },
  mapDotThree: { backgroundColor: bento.warning, borderRadius: 4, bottom: -14, height: 8, position: "absolute", right: 10, width: 8 },
  mapText: { color: bento.text, fontSize: 13, fontWeight: "900", marginTop: 6, textAlign: "center" },
  mapSubText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", textAlign: "center" },
  emptyActivity: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 18, borderWidth: 1, gap: 5, padding: 16 },
  emptyActivityTitle: { color: bento.text, fontSize: 14, fontWeight: "900", textAlign: "center" },
  emptyActivityText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, textAlign: "center" },
  activityRow: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 11 },
  activityText: { flex: 1, minWidth: 0 },
  activityTitle: { color: bento.text, fontSize: 13, fontWeight: "900" },
  activityMeta: { color: bento.textSecondary, fontSize: 11, fontWeight: "700", marginTop: 3 },
  activityValue: { color: bento.primaryDark, fontSize: 12, fontWeight: "900", maxWidth: 104, textAlign: "right" },
  actions: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  editButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 16, flex: 1, flexDirection: "row", gap: 8, height: 52, justifyContent: "center", minWidth: 150 },
  editText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  deleteButton: { alignItems: "center", backgroundColor: bento.dangerSoft, borderColor: "#FFCACA", borderRadius: 16, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, height: 52, justifyContent: "center", minWidth: 120 },
  deleteText: { color: bento.danger, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});

