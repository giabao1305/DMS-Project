import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { SummaryMetric, SummaryStrip } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Order, OrderStatus } from "../../types/domain";
import {
  currency,
  getCustomerName,
  shortDateTime,
  statusLabel,
} from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type OrderFilter = "all" | "unpaid" | OrderStatus;
type Tone = "primary" | "success" | "warning" | "danger" | "route" | "muted";

const filters: Array<{ key: OrderFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "delivered", label: "Đã giao" },
  { key: "unpaid", label: "Chưa thanh toán" },
  { key: "cancelled", label: "Hủy" },
];

export function OrdersList({
  orders,
  error,
  message,
  onBack,
  onCreate,
  onCheckIn,
  canCreate,
  onDetail,
  onEdit,
}: {
  orders: Order[];
  error?: string;
  message?: string;
  onBack: () => void;
  onCreate: () => void;
  onCheckIn: () => void;
  canCreate: boolean;
  onDetail: (order: Order) => void;
  onEdit: (order: Order) => void;
}) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      unpaid: orders.filter(isPaymentOutstanding).length,
      revenue: orders
        .filter((order) => order.status === "delivered")
        .reduce((sum, order) => sum + order.finalAmount, 0),
    }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter === "unpaid" && !isPaymentOutstanding(order)) return false;
      if (filter !== "all" && filter !== "unpaid" && order.status !== filter)
        return false;
      if (!keyword) return true;
      return [
        order.orderCode,
        getCustomerName(order.customer),
        order.note,
        statusLabel(order.status),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [filter, orders, query]);

  const hasFilter = query.trim().length > 0 || filter !== "all";

  return (
    <View style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={23}
              color="#FFFFFF"
            />
          </Pressable>
          <View style={styles.heading}>
            <Text style={styles.title}>Đơn hàng</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              canCreate ? "Tạo đơn hàng" : "Check-in để tạo đơn"
            }
            onPress={canCreate ? onCreate : onCheckIn}
            style={({ pressed }) => [
              styles.createButton,
              !canCreate && styles.checkInButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={canCreate ? "plus" : "crosshairs-gps"}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <SummaryStrip>
          <SummaryMetric
            label="Tổng đơn"
            value={stats.total}
            icon="clipboard-text-outline"
            tone="primary"
          />
          <SummaryMetric
            label="Chờ duyệt"
            value={stats.pending}
            icon="clock-outline"
            tone="warning"
          />
          <SummaryMetric
            label="Đã giao"
            value={stats.delivered}
            icon="truck-check-outline"
            tone="success"
          />
          <SummaryMetric
            label="Doanh thu giao"
            value={compactMoney(stats.revenue)}
            icon="cash-check"
            tone="blue"
          />
          <SummaryMetric
            label="Chưa thanh toán"
            value={stats.unpaid}
            icon="credit-card-clock-outline"
            tone="danger"
          />
        </SummaryStrip>

        {!canCreate ? (
          <Pressable
            onPress={onCheckIn}
            style={({ pressed }) => [
              styles.createPrompt,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="map-marker-check-outline"
              size={18}
              color={bento.route}
            />
            <Text style={styles.createPromptText}>
              Check-in điểm bán để tạo đơn mới
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={bento.route}
            />
          </Pressable>
        ) : null}

        <View style={styles.searchPanel}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={bento.textMuted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm mã đơn, khách hàng, ghi chú..."
              placeholderTextColor={bento.textMuted}
              style={styles.searchInput}
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={bento.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.filterRail}>
          {filters.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Notice type="error" message={error} />
        <Notice type="success" message={message} />

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Danh sách đơn</Text>
            <Text style={styles.listSubtitle}>
              {filteredOrders.length} kết quả
            </Text>
          </View>
          <Text style={styles.totalLabel}>{stats.total} đơn</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <EmptyPanel
            title={
              orders.length === 0 ? "Chưa có đơn hàng" : "Không có đơn phù hợp"
            }
            message={
              orders.length === 0
                ? "Tạo đơn đầu tiên từ khách hàng đang check-in."
                : hasFilter
                  ? "Thử đổi từ khóa hoặc trạng thái lọc."
                  : "Chưa có dữ liệu phù hợp."
            }
            actionLabel={
              orders.length === 0
                ? canCreate
                  ? "Tạo đơn hàng"
                  : "Check-in trước"
                : undefined
            }
            onAction={
              orders.length === 0
                ? canCreate
                  ? onCreate
                  : onCheckIn
                : undefined
            }
          />
        ) : (
          <View style={styles.orderStack}>
            {filteredOrders.map((order) => (
              <OrderRow
                key={order._id}
                order={order}
                onPress={() => onDetail(order)}
                onEdit={() => onEdit(order)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function OrderRow({
  order,
  onPress,
  onEdit,
}: {
  order: Order;
  onPress: () => void;
  onEdit: () => void;
}) {
  const colors = statusColors(order.status);
  const canEdit = order.status === "pending";
  const quantity = order.items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.orderRow,
        {
          backgroundColor: bento.surface,
          borderColor: colors.border,
          borderLeftColor: colors.text,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.orderTop}>
        <View
          style={[
            styles.statusMark,
            { backgroundColor: colors.text, borderColor: colors.text },
          ]}
        >
          <MaterialCommunityIcons
            name={statusIcon(order.status)}
            size={19}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderCode} numberOfLines={1}>
            {order.orderCode}
          </Text>
          <Text style={styles.customerName} numberOfLines={1}>
            {getCustomerName(order.customer)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: bento.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.statusText, { color: colors.text }]}
            numberOfLines={1}
          >
            {statusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View>
          <Text style={styles.amountCaption}>Thanh toán</Text>
          <Text style={styles.amountValue}>{currency(order.finalAmount)}</Text>
        </View>
        <View style={styles.itemMeta}>
          <Meta
            icon="package-variant-closed"
            text={`${order.items.length} loại sản phẩm`}
          />
          <Meta icon="cart-outline" text={`${quantity} sp`} />
          <Meta icon="clock-outline" text={shortDateTime(order.createdAt)} />
        </View>
      </View>

      <View style={styles.orderActions}>
        {canEdit ? (
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [
              styles.editAction,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={15}
              color={bento.primaryDark}
            />
            <Text style={styles.editText}>Sửa</Text>
          </Pressable>
        ) : (
          <View style={styles.readOnlyAction}>
            <Text style={styles.readOnlyText}>Chi tiết</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={bento.textMuted}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.meta}>
      <MaterialCommunityIcons name={icon} size={14} color={bento.textMuted} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Notice({
  type,
  message,
}: {
  type: "error" | "success";
  message?: string;
}) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <View
      style={[
        styles.notice,
        isError ? styles.noticeError : styles.noticeSuccess,
      ]}
    >
      <MaterialCommunityIcons
        name={isError ? "alert-circle-outline" : "check-circle-outline"}
        size={18}
        color={isError ? bento.danger : bento.success}
      />
      <Text
        style={[
          styles.noticeText,
          { color: isError ? bento.danger : bento.success },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

function EmptyPanel({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyPanel}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons
          name="receipt-text-plus-outline"
          size={28}
          color={bento.primaryDark}
        />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function statusIcon(status: OrderStatus): IconName {
  if (status === "delivered") return "truck-check-outline";
  if (status === "approved") return "check-decagram-outline";
  if (status === "cancelled" || status === "returned")
    return "close-circle-outline";
  if (status === "return_requested") return "backup-restore";
  return "clock-outline";
}

function statusColors(status: OrderStatus) {
  if (status === "delivered" || status === "approved")
    return toneColors("success");
  if (status === "cancelled" || status === "returned")
    return toneColors("danger");
  if (status === "return_requested") return toneColors("route");
  return toneColors("warning");
}

function toneColors(tone: Tone) {
  if (tone === "success")
    return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (tone === "warning")
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  if (tone === "danger")
    return { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (tone === "route")
    return { text: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" };
  if (tone === "muted")
    return {
      text: "#64748B",
      bg: "#F8FAFC",
      border: "#CBD5E1",
    };
  return {
    text: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  };
}

function isPaymentOutstanding(order: Order) {
  if (order.status !== "delivered") return false;
  if (order.paymentStatus === "paid") return false;

  const paidAmount = order.paidAmount || 0;
  const refundedAmount = order.refundedAmount || 0;
  const netCollected = Math.max(paidAmount - refundedAmount, 0);
  const balanceDue =
    order.balanceDue ?? Math.max(order.finalAmount - netCollected, 0);

  return balanceDue > 0 || order.paymentStatus === "unpaid";
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000)
    return `${Number((value / 1_000_000_000).toFixed(1))} tỷ`;
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))} tr`;
  return currency(value);
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: bento.background,
    flex: 1,
    minHeight: "100%",
  },
  page: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: "100%",
  },
  toolbar: {
    alignItems: "center",
    backgroundColor: "#103494",
    flexDirection: "row",
    gap: 10,
    marginHorizontal: -16,
    marginTop: -14,
    minHeight: 70,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  checkInButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.38)",
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: bento.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  createPrompt: {
    alignItems: "center",
    backgroundColor: bento.routeSoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  createPromptText: {
    color: bento.route,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  searchPanel: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    ...bentoSoftShadow,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 0,
    outlineStyle: "none" as never,
  },
  clearButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  filterRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: bento.primary,
    borderColor: bento.primary,
  },
  filterText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  notice: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  noticeError: {
    backgroundColor: bento.dangerSoft,
    borderColor: "#FFCACA",
  },
  noticeSuccess: {
    backgroundColor: bento.successSoft,
    borderColor: bento.borderStrong,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "700",
  },
  listSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  totalLabel: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  orderStack: {
    gap: 10,
    paddingBottom: 8,
  },
  orderRow: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    ...bentoSoftShadow,
  },
  orderTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  statusMark: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderWidth: 1,
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  orderIdentity: {
    flex: 1,
    minWidth: 0,
  },
  orderCode: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "700",
  },
  customerName: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 118,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  orderBody: {
    alignItems: "flex-start",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  amountCaption: {
    color: bento.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  amountValue: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  itemMeta: {
    alignItems: "flex-end",
    gap: 5,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  metaText: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  orderActions: {
    alignItems: "flex-end",
  },
  editAction: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  editText: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  readOnlyAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  readOnlyText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyPanel: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderRadius: 8,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  emptyTitle: {
    color: bento.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyMessage: {
    color: bento.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
  },
  emptyAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
});
