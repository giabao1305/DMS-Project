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
  StatusPill,
  SummaryMetric,
  SummaryStrip,
  SuccessBanner,
} from "../../components/Ui";
import { bento } from "../../theme";
import type { Order, OrderStatus } from "../../types/domain";
import { currency, getCustomerName, shortDateTime, statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type OrderFilter = "all" | OrderStatus;
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Hủy" },
];

export function OrdersList({
  orders,
  error,
  message,
  onBack,
  onCreate,
  onDetail,
  onEdit,
}: {
  orders: Order[];
  error?: string;
  message?: string;
  onBack: () => void;
  onCreate: () => void;
  onDetail: (order: Order) => void;
  onEdit: (order: Order) => void;
}) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => ({
    total: orders.length,
    revenue: orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0),
    pending: orders.filter((order) => order.status === "pending").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!keyword) return true;
      return [order.orderCode, getCustomerName(order.customer), order.note, statusLabel(order.status)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [filter, orders, query]);

  const hasActiveSearch = query.trim().length > 0 || filter !== "all";

  return (
    <ListScreen>
      <MockupHeader
        eyebrow="Đơn bán hàng"
        title="Đơn hàng"
        subtitle={`${filteredOrders.length} kết quả`}
        onBack={onBack}
        action={
          <Pressable onPress={onCreate} accessibilityRole="button" accessibilityLabel="Tạo đơn hàng" style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <SummaryStrip>
        <SummaryMetric icon="cash-register" label="Doanh thu" value={compactMoney(stats.revenue)} tone="primary" />
        <SummaryMetric icon="receipt-text-outline" label="Số đơn" value={`${stats.total}`} tone="blue" />
        <SummaryMetric icon="clock-outline" label="Chờ duyệt" value={`${stats.pending}`} tone="warning" />
        <SummaryMetric icon="truck-check-outline" label="Đã giao" value={`${stats.delivered}`} tone="success" />
      </SummaryStrip>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm mã đơn, khách hàng..." />

      <FilterTabs items={FILTERS} value={filter} onChange={setFilter} />

      <ErrorBanner message={error} />
      <SuccessBanner message={message} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách đơn</Text>
          <Text style={styles.sectionHint}>{filteredOrders.length} kết quả</Text>
        </View>
        <Text style={styles.sectionMeta}>{stats.total} tổng</Text>
      </View>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? "Chưa có đơn hàng" : "Không có đơn phù hợp"}
          message={orders.length === 0 ? "Tạo đơn mới từ danh sách khách hàng của bạn." : hasActiveSearch ? "Thử đổi từ khóa hoặc bộ lọc trạng thái." : "Hiện chưa có dữ liệu phù hợp để hiển thị."}
          icon="cart-plus"
          actionLabel={orders.length === 0 ? "Tạo đơn hàng" : undefined}
          onAction={orders.length === 0 ? onCreate : undefined}
        />
      ) : (
        <View style={styles.list}>
          {filteredOrders.map((order) => (
            <OrderCard key={order._id} order={order} onPress={() => onDetail(order)} onEdit={() => onEdit(order)} />
          ))}
        </View>
      )}
    </ListScreen>
  );
}

function OrderCard({ order, onPress, onEdit }: { order: Order; onPress: () => void; onEdit: () => void }) {
  const canEdit = order.status === "pending";
  const tone = statusTone(order.status);
  const itemCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <ListCard onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.orderIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <MaterialCommunityIcons name={statusIcon(order.status)} size={21} color={tone.text} />
        </View>
        <View style={styles.orderMain}>
          <View style={styles.titleLine}>
            <Text style={styles.orderCode} numberOfLines={1}>{order.orderCode}</Text>
            <StatusPill label={statusLabel(order.status)} tone={tone.pillTone} compact />
          </View>
          <Text style={styles.customerName} numberOfLines={1}>{getCustomerName(order.customer)}</Text>
        </View>
      </View>

      <View style={styles.amountLine}>
        <View>
          <Text style={styles.amountLabel}>Thanh toán</Text>
          <Text style={styles.amountValue}>{currency(order.finalAmount)}</Text>
        </View>
        {canEdit ? (
          <Pressable onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={bento.primaryDark} />
            <Text style={styles.editText}>Sửa</Text>
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={20} color={bento.textMuted} />
        )}
      </View>

      <View style={styles.metaRow}>
        <MetaItem icon="package-variant-closed" value={`${order.items.length} SP / ${itemCount} món`} />
        <MetaItem icon="clock-outline" value={shortDateTime(order.createdAt)} />
      </View>
    </ListCard>
  );
}

function MetaItem({ icon, value }: { icon: IconName; value: string }) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={14} color={bento.textMuted} />
      <Text style={styles.metaText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `${Number((value / 1_000_000_000).toFixed(1))}B`;
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return currency(value);
}

function statusIcon(status: OrderStatus): IconName {
  if (status === "delivered") return "truck-check-outline";
  if (status === "approved") return "check-decagram-outline";
  if (status === "cancelled" || status === "returned") return "close-circle-outline";
  if (status === "return_requested") return "backup-restore";
  return "clock-outline";
}

function statusTone(status: OrderStatus) {
  if (status === "delivered" || status === "approved") return { ...toneColors("success"), pillTone: "success" as const };
  if (status === "cancelled" || status === "returned") return { ...toneColors("danger"), pillTone: "danger" as const };
  if (status === "return_requested") return { ...toneColors("blue"), pillTone: "blue" as const };
  return { ...toneColors("warning"), pillTone: "warning" as const };
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
  createButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 15, height: 44, justifyContent: "center", width: 44 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  sectionHint: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 },
  sectionMeta: { color: bento.primaryDark, fontSize: 12, fontWeight: "900" },
  list: { gap: 12, paddingBottom: 4 },
  cardTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  orderIcon: { alignItems: "center", borderRadius: 16, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  orderMain: { flex: 1, minWidth: 0 },
  titleLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  orderCode: { color: bento.text, flex: 1, fontSize: 15, fontWeight: "900" },
  customerName: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 5 },
  amountLine: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 11 },
  amountLabel: { color: bento.textMuted, fontSize: 11, fontWeight: "800" },
  amountValue: { color: bento.text, fontSize: 17, fontWeight: "900", marginTop: 2 },
  editButton: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 7 },
  editText: { color: bento.primaryDark, fontSize: 11, fontWeight: "900" },
  metaRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaItem: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderRadius: 999, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  metaText: { color: bento.textSecondary, fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
