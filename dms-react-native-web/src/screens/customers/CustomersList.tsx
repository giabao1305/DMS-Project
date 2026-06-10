import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  EmptyState,
  ErrorBanner,
  FilterTabs,
  ListCard,
  ListScreen,
  SearchBar,
  StatusPill,
  SummaryMetric,
  SummaryStrip,
  SuccessBanner,
} from "../../components/Ui";
import { bento } from "../../theme";
import type { Customer } from "../../types/domain";
import { statusLabel } from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type CustomerFilter = "all" | "pending" | "approved" | "rejected";
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";

const FILTERS: Array<{ key: CustomerFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "approved", label: "Đã duyệt" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "rejected", label: "Từ chối" },
];

export function CustomersList({
  customers,
  error,
  message,
  onBack,
  onCreate,
  onDetail,
}: {
  customers: Customer[];
  error?: string;
  message?: string;
  onBack: () => void;
  onCreate: () => void;
  onDetail: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");

  const stats = useMemo(
    () => ({
      total: customers.length,
      pending: customers.filter((customer) => customer.status === "pending")
        .length,
      approved: customers.filter((customer) => customer.status === "approved")
        .length,
      rejected: customers.filter((customer) => customer.status === "rejected")
        .length,
    }),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return customers.filter((customer) => {
      if (filter !== "all" && customer.status !== filter) return false;
      if (!keyword) return true;
      return [
        customer.name,
        customer.address,
        customer.phone,
        customer.ownerName,
        customer.customerType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [customers, filter, query]);

  const hasActiveSearch = query.trim().length > 0 || filter !== "all";

  return (
    <ListScreen>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={({ pressed }) => [
            styles.backButton,
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
          <Text style={styles.title}>Khách hàng</Text>
          <Text style={styles.subtitle}>
            {filteredCustomers.length} kết quả
          </Text>
        </View>

        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Thêm khách hàng"
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={22}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <SummaryStrip>
        <SummaryMetric
          icon="storefront-outline"
          label="Tổng"
          value={stats.total}
          tone="primary"
        />
        <SummaryMetric
          icon="check-decagram-outline"
          label="Đã duyệt"
          value={stats.approved}
          tone="success"
        />
        <SummaryMetric
          icon="clock-outline"
          label="Chờ duyệt"
          value={stats.pending}
          tone="warning"
        />
        <SummaryMetric
          icon="close-circle-outline"
          label="Từ chối"
          value={stats.rejected}
          tone="danger"
        />
      </SummaryStrip>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Tìm tên, SĐT, địa chỉ..."
      />

      <FilterTabs items={FILTERS} value={filter} onChange={setFilter} />

      <ErrorBanner message={error} />
      <SuccessBanner message={message} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Khách hàng</Text>
          <Text style={styles.sectionHint}>
            {filteredCustomers.length} kết quả
          </Text>
        </View>
        <Text style={styles.sectionMeta}>{stats.approved} hoạt động</Text>
      </View>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          title={
            customers.length === 0
              ? "Chưa có khách hàng"
              : "Không tìm thấy khách hàng"
          }
          message={
            customers.length === 0
              ? "Thêm khách hàng đầu tiên để bắt đầu ghé thăm và tạo đơn hàng."
              : hasActiveSearch
                ? "Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác."
                : "Hiện chưa có dữ liệu phù hợp để hiển thị."
          }
          icon="storefront-plus-outline"
          actionLabel={customers.length === 0 ? "Thêm khách hàng" : undefined}
          onAction={customers.length === 0 ? onCreate : undefined}
        />
      ) : (
        <View style={styles.list}>
          {filteredCustomers.map((customer, index) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              index={index}
              onPress={() => onDetail(customer)}
            />
          ))}
        </View>
      )}
    </ListScreen>
  );
}

function CustomerCard({
  customer,
  index,
  onPress,
}: {
  customer: Customer;
  index: number;
  onPress: () => void;
}) {
  const status = statusTone(customer.status);
  const avatar = avatarTone(index);

  return (
    <ListCard
      onPress={onPress}
      style={{ borderColor: status.border, borderLeftColor: status.text }}
    >
      <View style={styles.customerTop}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: avatar.text, borderColor: avatar.text },
          ]}
        >
          <Text style={[styles.avatarText, { color: "#FFFFFF" }]}>
            {customerInitial(customer)}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer.name}
            </Text>
            <StatusPill
              label={statusLabel(customer.status)}
              tone={status.pillTone}
              compact
            />
          </View>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color={bento.textMuted}
            />
            <Text style={styles.address} numberOfLines={1}>
              {customer.address || "Chưa có địa chỉ"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta
          icon="phone-outline"
          value={customer.phone || "Chưa có SĐT"}
          primary
        />
        <Meta
          icon="storefront-outline"
          value={customer.ownerName || "Chưa có cửa hàng"}
        />
        <MaterialCommunityIcons
          name="chevron-right"
          size={19}
          color={bento.textMuted}
        />
      </View>
    </ListCard>
  );
}

function Meta({
  icon,
  value,
  primary,
}: {
  icon: IconName;
  value: string;
  primary?: boolean;
}) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={primary ? bento.primaryDark : bento.textMuted}
      />
      <Text
        style={[styles.metaText, primary && styles.metaTextPrimary]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function customerInitial(customer: Customer) {
  const source = customer.name || customer.ownerName || "K";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] || ""}`.toUpperCase();
}

function avatarTone(index: number) {
  const tones = [
    {
      text: bento.primaryDark,
      bg: bento.primarySoft,
      border: bento.borderStrong,
    },
    { text: bento.route, bg: bento.routeSoft, border: "#CFE0FF" },
    { text: bento.success, bg: bento.successSoft, border: bento.borderStrong },
    { text: bento.warning, bg: bento.warningSoft, border: "#FFE0A8" },
  ];
  return tones[index % tones.length];
}

function statusTone(status: Customer["status"]) {
  if (status === "approved")
    return { ...toneColors("success"), pillTone: "success" as const };
  if (status === "rejected")
    return { ...toneColors("danger"), pillTone: "danger" as const };
  return { ...toneColors("warning"), pillTone: "warning" as const };
}

function toneColors(tone: ToneName) {
  if (tone === "success")
    return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (tone === "warning")
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  if (tone === "danger")
    return { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (tone === "blue")
    return { text: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" };
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

const styles = StyleSheet.create({
  header: {
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
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 26,
  },
  subtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  sectionMeta: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    gap: 12,
    paddingBottom: 4,
  },
  customerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "700",
  },
  customerInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  customerName: {
    color: bento.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  addressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 7,
  },
  address: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  metaRow: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metaItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  metaText: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  metaTextPrimary: {
    color: bento.primaryDark,
  },
  pressed: {
    opacity: 0.72,
  },
});
