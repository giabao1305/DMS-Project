import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner, Field, PrimaryButton, StepTimeline, SuccessBanner } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Order, OrderStatus } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import { currency, getCustomerName, getProductName, shortDateTime, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

const ORDER_STEPS: Array<{ key: string; label: string; icon: IconName }> = [
  { key: "pending", label: "Đặt hàng", icon: "cart-check" },
  { key: "approved", label: "Xác nhận", icon: "check-decagram-outline" },
  { key: "delivering", label: "Đang giao", icon: "truck-fast-outline" },
  { key: "delivered", label: "Hoàn thành", icon: "check-circle-outline" },
];

export function OrderDetail({ order, onBack, onEdit, onChanged }: { order: Order; onBack: () => void; onEdit: () => void; onChanged: (order: Order) => void }) {
  const [returnReason, setReturnReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canEdit = order.status === "pending";
  const tone = statusTone(order.status);
  const progress = orderProgress(order.status);

  const cancel = () => {
    Alert.alert("Hủy đơn", `Hủy đơn ${order.orderCode}?`, [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          setSubmitting(true);
          setError("");
          setMessage("");
          try {
            onChanged(await sellerApi.cancelOrder(order._id));
            setMessage("Đã hủy đơn hàng.");
          } catch (err) {
            setError(toVietnameseError(err instanceof Error ? err.message : "Không hủy được đơn"));
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const requestReturn = async () => {
    const reason = returnReason.trim();
    if (!reason) {
      setError("Vui lòng nhập lý do trả hàng.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      onChanged(await sellerApi.requestReturnOrder(order._id, reason));
      setReturnReason("");
      setMessage("Đã gửi yêu cầu trả hàng.");
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không gửi được yêu cầu trả hàng"));
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
            <Text style={styles.eyebrow}>Chi tiết đơn</Text>
            <Text style={styles.title}>{order.orderCode}</Text>
          </View>
          {canEdit ? (
            <Pressable onPress={onEdit} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="square-edit-outline" size={20} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View style={[styles.headerStatusIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <MaterialCommunityIcons name={statusIcon(order.status)} size={21} color={tone.text} />
            </View>
          )}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Khách hàng</Text>
              <Text style={styles.customerName} numberOfLines={2}>{getCustomerName(order.customer)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(order.status)}</Text>
            </View>
          </View>
          <View style={styles.heroAmount}>
            <Text style={styles.amountLabelLight}>Thanh toán</Text>
            <Text style={styles.amountHero}>{currency(order.finalAmount)}</Text>
            <Text style={styles.createdAt}>Tạo lúc {shortDateTime(order.createdAt)}</Text>
          </View>
        </View>

        <ErrorBanner message={error} />
        <SuccessBanner message={message} />

        <View style={styles.timelineCard}>
          <SectionTitle icon="timeline-check-outline" title="Tiến trình đơn hàng" tone="blue" />
          <StepTimeline steps={ORDER_STEPS.map((step, index) => ({ ...step, state: stepState(order.status, index) }))} />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: tone.text }]} />
          </View>
          <Text style={styles.progressText}>{progress}% hoàn tất</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile icon="package-variant-closed" label="Sản phẩm" value={`${order.items.length} dòng`} tone="blue" />
          <InfoTile icon="cart-outline" label="Số lượng" value={`${itemQuantity(order)} món`} tone="primary" />
          <InfoTile icon="sale-outline" label="Giảm giá" value={currency(order.discountAmount)} tone="success" />
          <InfoTile icon="truck-check-outline" label="Giao lúc" value={shortDateTime(order.deliveredAt)} tone="muted" />
        </View>

        <View style={styles.card}>
          <SectionTitle icon="credit-card-outline" title="Thanh toán" tone="primary" />
          <DetailRow label="Tạm tính" value={currency(order.totalAmount)} />
          <DetailRow label="Giảm giá" value={currency(order.discountAmount)} />
          <DetailRow label="Thành tiền" value={currency(order.finalAmount)} strong />
          <DetailRow label="Lý do trả" value={order.returnReason || "-"} />
        </View>

        <View style={styles.card}>
          <SectionTitle icon="package-variant-closed" title="Sản phẩm" tone="blue" />
          <View style={styles.productList}>
            {order.items.map((item, index) => (
              <View key={`${order._id}-${getProductName(item.product)}-${index}`} style={styles.productRow}>
                <View style={styles.productImage}>
                  <MaterialCommunityIcons name="package-variant-closed" size={20} color={bento.primaryDark} />
                </View>
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={2}>{getProductName(item.product)}</Text>
                  <Text style={styles.productMeta}>{currency(item.price)} x {item.quantity}</Text>
                </View>
                <Text style={styles.productSubtotal}>{currency(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {order.status === "delivered" ? (
            <View style={styles.returnBox}>
              <Field label="Lý do trả hàng" value={returnReason} onChangeText={setReturnReason} />
              <PrimaryButton label="Yêu cầu trả hàng" onPress={requestReturn} loading={submitting} disabled={!returnReason.trim()} variant="muted" icon="backup-restore" />
            </View>
          ) : null}
        </View>

        {canEdit ? (
          <View style={styles.actionCard}>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Đơn đang chờ xử lý</Text>
              <Text style={styles.actionHint}>Bạn có thể chỉnh sửa hoặc hủy đơn trước khi được duyệt.</Text>
            </View>
            <View style={styles.actions}>
              <PrimaryButton label="Sửa đơn" onPress={onEdit} variant="muted" icon="pencil" style={styles.actionButton} />
              <PrimaryButton label="Hủy đơn" onPress={cancel} loading={submitting} variant="danger" icon="close" style={styles.actionButton} />
            </View>
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

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, strong && styles.detailValueStrong]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function itemQuantity(order: Order) {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function orderProgress(status: OrderStatus) {
  if (status === "delivered") return 100;
  if (status === "approved") return 66;
  if (status === "pending") return 25;
  if (status === "return_requested" || status === "returned") return 80;
  return 0;
}

function stepState(status: OrderStatus, index: number): "done" | "active" | "todo" {
  if (status === "cancelled" || status === "returned") return index === 0 ? "active" : "todo";
  const activeIndex = status === "delivered" ? 3 : status === "approved" ? 1 : status === "return_requested" ? 3 : 0;
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "todo";
}

function statusIcon(status: OrderStatus): IconName {
  if (status === "delivered") return "truck-check-outline";
  if (status === "approved") return "check-decagram-outline";
  if (status === "cancelled" || status === "returned") return "close-circle-outline";
  if (status === "return_requested") return "backup-restore";
  return "clock-outline";
}

function statusTone(status: OrderStatus) {
  if (status === "delivered" || status === "approved") return toneColors("success");
  if (status === "cancelled" || status === "returned") return toneColors("danger");
  if (status === "return_requested") return toneColors("blue");
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
  screen: {
    backgroundColor: bento.background,
    flex: 1,
  },
  scrollContent: {
    minHeight: "100%",
    paddingBottom: 24,
  },
  page: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 760,
    paddingHorizontal: 20,
    paddingTop: 18,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 15,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...bentoSoftShadow,
  },
  headerAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 15,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...bentoSoftShadow,
  },
  headerStatusIcon: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: bento.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    color: bento.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 18,
    padding: 16,
    ...bentoSoftShadow,
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  customerName: {
    color: bento.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    marginTop: 5,
    maxWidth: 240,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  heroAmount: {
    gap: 3,
  },
  amountLabelLight: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  amountHero: {
    color: bento.primaryDark,
    fontSize: 31,
    fontWeight: "900",
  },
  createdAt: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  timelineCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 15,
    padding: 16,
    ...bentoSoftShadow,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sectionTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "900",
  },
  progressTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999,
    height: "100%",
  },
  progressText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoTile: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 104,
    padding: 13,
    ...bentoSoftShadow,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  infoValue: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 11,
  },
  infoLabel: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  detailRow: {
    alignItems: "flex-start",
    borderTopColor: bento.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 11,
  },
  detailLabel: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  detailValue: {
    color: bento.text,
    flex: 1.25,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  detailValueStrong: {
    color: bento.primaryDark,
    fontSize: 15,
  },
  productList: {
    gap: 10,
  },
  productRow: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 70,
    padding: 11,
  },
  productImage: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 15,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  productBody: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "900",
  },
  productMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  productSubtotal: {
    color: bento.text,
    fontSize: 12,
    fontWeight: "900",
  },
  returnBox: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  actionText: {
    gap: 4,
  },
  actionTitle: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "900",
  },
  actionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 130,
  },
  pressed: {
    opacity: 0.72,
  },
});

