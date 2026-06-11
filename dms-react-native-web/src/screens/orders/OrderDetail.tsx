import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { sellerApi } from "../../api/sellerApi";
import {
  ErrorBanner,
  Field,
  PrimaryButton,
  StepTimeline,
  SuccessBanner,
} from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Order, OrderStatus, PaymentMethod } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import {
  currency,
  getCustomerName,
  getProductName,
  shortDateTime,
  statusLabel,
} from "../../utils/format";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "blue"
  | "routeAlt"
  | "violet"
  | "muted";

const ORDER_STEPS: Array<{ key: string; label: string; icon: IconName }> = [
  { key: "pending", label: "Đặt hàng", icon: "cart-check" },
  { key: "approved", label: "Xác nhận", icon: "check-decagram-outline" },
  { key: "delivering", label: "Đang giao", icon: "truck-fast-outline" },
  { key: "delivered", label: "Hoàn thành", icon: "check-circle-outline" },
];

export function OrderDetail({
  order,
  onBack,
  onEdit,
  onChanged,
}: {
  order: Order;
  onBack: () => void;
  onEdit: () => void;
  onChanged: (order: Order) => void;
}) {
  const [returnReason, setReturnReason] = useState("");
  const [returnFormOpen, setReturnFormOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [transferPaymentUrl, setTransferPaymentUrl] = useState("");
  const [transferQrLoading, setTransferQrLoading] = useState(false);
  const [transferQrError, setTransferQrError] = useState("");
  const [transferPaymentDone, setTransferPaymentDone] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canEdit = order.status === "pending";
  const tone = statusTone(order.status);
  const progress = orderProgress(order.status);
  const paidAmount = order.paidAmount || 0;
  const refundedAmount = order.refundedAmount || 0;
  const netCollected = Math.max(paidAmount - refundedAmount, 0);
  const balanceDue =
    order.balanceDue ?? Math.max(order.finalAmount - netCollected, 0);
  const canRequestReturn = order.status === "delivered";
  const transferNote = order.orderCode;
  const transferQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
    transferPaymentUrl || transferNote,
  )}`;
  const suggestedPaymentAmount = Number(paymentAmount || balanceDue);

  useEffect(() => {
    if (paymentMethod !== "bank_transfer") {
      setTransferPaymentUrl("");
      setTransferQrError("");
      return;
    }
    if (!Number.isFinite(suggestedPaymentAmount) || suggestedPaymentAmount <= 0)
      return;

    let isMounted = true;
    setTransferQrLoading(true);
    setTransferQrError("");
    sellerApi
      .createVnpayPaymentUrl(order._id, { amount: suggestedPaymentAmount })
      .then((response) => {
        if (!isMounted) return;
        setTransferPaymentUrl(response.paymentUrl);
      })
      .catch((err) => {
        if (!isMounted) return;
        setTransferPaymentUrl("");
        setTransferQrError(
          toVietnameseError(
            err instanceof Error ? err.message : "Không tạo được QR VNPay",
          ),
        );
      })
      .finally(() => {
        if (isMounted) setTransferQrLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [balanceDue, order._id, paymentAmount, paymentMethod, suggestedPaymentAmount]);

  useEffect(() => {
    setTransferPaymentDone(false);
  }, [order._id]);

  useEffect(() => {
    if (!transferPaymentUrl || paymentMethod !== "bank_transfer" || balanceDue <= 0)
      return;

    let isMounted = true;
    let attempts = 0;

    const checkPaymentStatus = async () => {
      attempts += 1;
      try {
        const updatedOrder = await sellerApi.order(order._id);
        const updatedPaidAmount = updatedOrder.paidAmount || 0;
        const updatedRefundedAmount = updatedOrder.refundedAmount || 0;
        const updatedNetCollected = Math.max(
          updatedPaidAmount - updatedRefundedAmount,
          0,
        );
        const updatedBalanceDue =
          updatedOrder.balanceDue ??
          Math.max(updatedOrder.finalAmount - updatedNetCollected, 0);
        const hasNewPayment =
          updatedPaidAmount > paidAmount || updatedBalanceDue < balanceDue;

        if (!hasNewPayment) return false;
        if (!isMounted) return true;

        setTransferPaymentDone(true);
        setTransferQrError("");
        setPaymentAmount("");
        setPaymentNote("");
        setMessage(
          updatedBalanceDue <= 0
            ? "Thanh toán VNPay thành công. Đơn đã thu đủ tiền."
            : "Thanh toán VNPay thành công. Đã cập nhật số tiền đã thu.",
        );
        onChanged(updatedOrder);
        return true;
      } catch {
        return false;
      }
    };

    const firstCheck = setTimeout(() => {
      void checkPaymentStatus().then((done) => {
        if (done) clearInterval(interval);
      });
    }, 2500);
    const interval = setInterval(() => {
      if (attempts >= 36) {
        clearInterval(interval);
        return;
      }
      void checkPaymentStatus().then((done) => {
        if (done) clearInterval(interval);
      });
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(firstCheck);
      clearInterval(interval);
    };
  }, [
    balanceDue,
    onChanged,
    order._id,
    paidAmount,
    paymentMethod,
    transferPaymentUrl,
  ]);

  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setPaymentNote((currentNote) => {
      const trimmedNote = currentNote.trim();
      if (method === "bank_transfer" && !trimmedNote) return transferNote;
      if (method !== "bank_transfer" && trimmedNote === transferNote) return "";
      return currentNote;
    });
  };

  const openTransferPayment = async () => {
    if (!transferPaymentUrl) return;
    await Linking.openURL(transferPaymentUrl);
  };

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
            setError(
              toVietnameseError(
                err instanceof Error ? err.message : "Không hủy được đơn",
              ),
            );
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
      setReturnFormOpen(false);
      setMessage("Đã gửi yêu cầu trả hàng.");
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error
            ? err.message
            : "Không gửi được yêu cầu trả hàng",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const recordPayment = async () => {
    const amount = Number(paymentAmount || balanceDue);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balanceDue) {
      setError("Số tiền thu phải lớn hơn 0 và không vượt công nợ.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const note =
        paymentNote.trim() ||
        (paymentMethod === "bank_transfer" ? transferNote : undefined);
      onChanged(
        await sellerApi.recordOrderPayment(order._id, {
          amount,
          method: paymentMethod,
          note,
        }),
      );
      setPaymentAmount("");
      setPaymentNote("");
      setMessage("Đã ghi nhận thu tiền.");
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không ghi nhận được thu tiền",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
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
            <Text style={styles.eyebrow}>Chi tiết đơn</Text>
            <Text style={styles.title}>{order.orderCode}</Text>
          </View>
          {canEdit ? (
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.headerAction,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.headerStatusIcon,
                { backgroundColor: tone.text, borderColor: tone.text },
              ]}
            >
              <MaterialCommunityIcons
                name={statusIcon(order.status)}
                size={21}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: bento.surface,
              borderColor: tone.border,
              borderLeftColor: tone.text,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Khách hàng</Text>
              <Text style={styles.customerName} numberOfLines={2}>
                {getCustomerName(order.customer)}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: bento.surface, borderColor: tone.border },
              ]}
            >
              <Text style={[styles.statusText, { color: tone.text }]}>
                {statusLabel(order.status)}
              </Text>
            </View>
          </View>
          <View style={styles.heroAmount}>
            <Text style={styles.amountLabelLight}>Thanh toán</Text>
            <Text style={styles.amountHero}>{currency(order.finalAmount)}</Text>
            <Text style={styles.createdAt}>
              Tạo lúc {shortDateTime(order.createdAt)}
            </Text>
          </View>
        </View>

        <ErrorBanner message={error} />
        <SuccessBanner message={message} />

        <View style={[styles.timelineCard, { borderLeftColor: tone.text }]}>
          <SectionTitle
            icon="timeline-check-outline"
            title="Tiến trình đơn hàng"
            tone="routeAlt"
          />
          <StepTimeline
            steps={ORDER_STEPS.map((step, index) => ({
              ...step,
              state: stepState(order.status, index),
            }))}
          />
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: tone.text },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress}% hoàn tất</Text>
        </View>

        <View style={styles.card}>
          <SectionTitle
            icon="clipboard-list-outline"
            title="Chi tiết đơn"
            tone="blue"
          />
          <Text style={styles.subSectionLabel}>Sản phẩm</Text>
          <View style={styles.productList}>
            {order.items.map((item, index) => (
              <View
                key={`${order._id}-${productDisplayName(item)}-${index}`}
                style={styles.productRow}
              >
                <ProductThumb item={item} />
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {productDisplayName(item)}
                  </Text>
                  <Text style={styles.productMeta}>
                    {currency(item.price)} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.productSubtotal}>
                  {currency(item.subtotal)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.subSectionLabel}>Thanh toán</Text>
          <DetailRow
            label="Số loại sản phẩm"
            value={`${order.items.length} loại`}
          />
          <DetailRow
            label="Tổng số lượng"
            value={`${itemQuantity(order)} sản phẩm`}
          />
          <DetailRow label="Tạm tính" value={currency(order.totalAmount)} />
          <DetailRow label="Giảm giá" value={currency(order.discountAmount)} />
          <DetailRow
            label="Thành tiền"
            value={currency(order.finalAmount)}
            strong
          />
          <DetailRow label="Đã thu" value={currency(paidAmount)} />
          <DetailRow label="Đã hoàn" value={currency(refundedAmount)} />
          <DetailRow label="Thực giữ" value={currency(netCollected)} />
          <DetailRow label="Còn nợ" value={currency(balanceDue)} strong />
          {order.status === "delivered" && balanceDue <= 0 ? (
            <View style={styles.paymentDoneBox}>
              <View style={styles.paymentDoneIcon}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={22}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.paymentDoneText}>
                <Text style={styles.paymentDoneTitle}>Thanh toán xong</Text>
                <Text style={styles.paymentDoneSubtitle}>
                  Đơn đã được ghi nhận thu đủ tiền.
                </Text>
              </View>
            </View>
          ) : null}
          <DetailRow
            label="Giao lúc"
            value={shortDateTime(order.deliveredAt)}
          />
          <DetailRow label="Lý do trả" value={order.returnReason || "-"} />
          {order.status === "delivered" && balanceDue > 0 ? (
            <View style={styles.returnBox}>
              <Text style={styles.subSectionLabel}>
                Ghi nhận tiền khách trả
              </Text>
              <Field
                label="Số tiền thu"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder={`${balanceDue}`}
                keyboardType="number-pad"
              />
              <View style={styles.paymentMethods}>
                {(
                  [
                    ["cash", "Tiền mặt"],
                    ["bank_transfer", "Chuyển khoản"],
                    ["other", "Khác"],
                  ] as Array<[PaymentMethod, string]>
                ).map(([method, label]) => (
                  <Pressable
                    key={method}
                    onPress={() => selectPaymentMethod(method)}
                    style={[
                      styles.paymentMethod,
                      paymentMethod === method && styles.paymentMethodActive,
                    ]}
                  >
                    <Text
                      style={
                        paymentMethod === method
                          ? styles.paymentMethodActiveText
                          : styles.paymentMethodText
                      }
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {paymentMethod === "bank_transfer" ? (
                <View style={styles.paymentQrBox}>
                  <View style={styles.paymentQrHeader}>
                    <View style={styles.paymentQrIcon}>
                      <MaterialCommunityIcons
                        name="qrcode-scan"
                        size={20}
                        color={bento.primaryDark}
                      />
                    </View>
                    <View style={styles.paymentQrText}>
                      <Text style={styles.paymentQrTitle}>QR chuyển khoản</Text>
                      <Text style={styles.paymentQrSubtitle}>
                        {transferPaymentDone
                          ? "Thanh toán đã được ghi nhận"
                          : transferQrLoading
                          ? "Đang tạo QR VNPay sandbox"
                          : transferPaymentUrl
                            ? "Quét để thanh toán sandbox"
                            : "Nội dung là mã đơn hàng"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentQrBody}>
                    <View style={styles.paymentQrImageWrap}>
                      {transferQrLoading ? (
                        <ActivityIndicator color={bento.primaryDark} />
                      ) : (
                        <Image
                          source={{ uri: transferQrUrl }}
                          style={styles.paymentQrImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                    <View style={styles.paymentQrMeta}>
                      <Text style={styles.paymentQrLabel}>Nội dung</Text>
                      <Text style={styles.paymentQrValue}>{transferNote}</Text>
                      <Text style={styles.paymentQrLabel}>Số tiền</Text>
                      <Text style={styles.paymentQrAmount}>
                        {currency(suggestedPaymentAmount)}
                      </Text>
                      {transferQrError ? (
                        <Text style={styles.paymentQrError}>
                          {transferQrError}
                        </Text>
                      ) : null}
                      {transferPaymentUrl ? (
                        <Pressable
                          onPress={openTransferPayment}
                          style={({ pressed }) => [
                            styles.paymentQrLink,
                            pressed && styles.pressed,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="open-in-new"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.paymentQrLinkText}>
                            Mở VNPay sandbox
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : null}
              <Field
                label="Ghi chú thu tiền"
                value={paymentNote}
                onChangeText={setPaymentNote}
                placeholder="Tùy chọn"
              />
              <PrimaryButton
                label="Ghi nhận thu tiền"
                onPress={recordPayment}
                loading={submitting}
                icon="cash-check"
              />
            </View>
          ) : null}
          {canRequestReturn ? (
            <View style={styles.returnBox}>
              <PrimaryButton
                label="Trả hàng"
                onPress={() => {
                  setError("");
                  setMessage("");
                  setReturnReason("");
                  setReturnFormOpen(true);
                }}
                loading={submitting}
                variant="muted"
                icon="backup-restore"
              />
            </View>
          ) : null}
          {order.status === "return_requested" ? (
            <Text style={styles.refundHint}>
              Yêu cầu trả hàng đang chờ NPP duyệt. Khi duyệt, hệ thống sẽ tự
              ghi nhận hoàn tiền và trả hàng.
            </Text>
          ) : null}
        </View>

        {canEdit ? (
          <View style={styles.actionCard}>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Đơn đang chờ xử lý</Text>
              <Text style={styles.actionHint}>
                Bạn có thể chỉnh sửa hoặc hủy đơn trước khi được duyệt.
              </Text>
            </View>
            <View style={styles.actions}>
              <PrimaryButton
                label="Sửa đơn"
                onPress={onEdit}
                variant="muted"
                icon="pencil"
                style={styles.actionButton}
              />
              <PrimaryButton
                label="Hủy đơn"
                onPress={cancel}
                loading={submitting}
                variant="danger"
                icon="close"
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : null}

        <Modal
          animationType="fade"
          transparent
          visible={returnFormOpen}
          onRequestClose={() => setReturnFormOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.returnModalCard}>
                <Text style={styles.returnModalTitle}>Trả hàng</Text>
                <Text style={styles.returnModalHint}>
                  Nhập lý do trả hàng để gửi yêu cầu xử lý đơn {order.orderCode}.
                </Text>
                <ScrollView
                  style={styles.returnModalScroll}
                  contentContainerStyle={styles.returnModalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                <View style={styles.returnPreviewBox}>
                  <Text style={styles.returnPreviewTitle}>Thông tin khách hàng</Text>
                  <DetailRow
                    label="Khách hàng"
                    value={getCustomerName(order.customer)}
                  />
                  <DetailRow
                    label="Số điện thoại"
                    value={customerPhone(order.customer)}
                  />
                  <DetailRow
                    label="Địa chỉ"
                    value={customerAddress(order.customer)}
                  />
                </View>
                <View style={styles.returnPreviewBox}>
                  <Text style={styles.returnPreviewTitle}>Sản phẩm trả hàng</Text>
                  {order.items.map((item, index) => (
                    <View
                      key={`return-${order._id}-${productDisplayName(item)}-${index}`}
                      style={styles.returnProductRow}
                    >
                      <ProductThumb item={item} />
                      <View style={styles.returnProductBody}>
                        <Text style={styles.returnProductName} numberOfLines={2}>
                          {productDisplayName(item)}
                        </Text>
                        <Text style={styles.returnProductMeta}>
                          SL {item.quantity} x {currency(item.price)}
                        </Text>
                      </View>
                      <Text style={styles.returnProductAmount}>
                        {currency(item.subtotal)}
                      </Text>
                    </View>
                  ))}
                  <DetailRow label="Giá trị đơn" value={currency(order.finalAmount)} />
                  <DetailRow label="Tiền đã thu" value={currency(netCollected)} strong />
                </View>
                <Field
                  label="Lý do trả hàng"
                  value={returnReason}
                  onChangeText={setReturnReason}
                  multiline
                />
                </ScrollView>
                <View style={styles.modalActions}>
                  <PrimaryButton
                    label="Đóng"
                    onPress={() => setReturnFormOpen(false)}
                    variant="ghost"
                    style={styles.modalButton}
                  />
                  <PrimaryButton
                    label="Gửi yêu cầu"
                    onPress={requestReturn}
                    loading={submitting}
                    disabled={!returnReason.trim()}
                    icon="send"
                    style={styles.modalButton}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScrollView>
  );
}

function SectionTitle({
  icon,
  title,
  tone,
}: {
  icon: IconName;
  title: string;
  tone: ToneName;
}) {
  const color = toneColors(tone);
  return (
    <View style={styles.sectionTitleRow}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: color.text, borderColor: color.text },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ProductThumb({ item }: { item: Order["items"][number] }) {
  const image = productImage(item);
  if (image)
    return (
      <Image
        source={{ uri: image }}
        style={styles.productImage}
        resizeMode="cover"
      />
    );
  return (
    <View style={[styles.productImage, styles.productFallback]}>
      <MaterialCommunityIcons
        name="package-variant-closed"
        size={20}
        color={bento.primaryDark}
      />
    </View>
  );
}

function productDisplayName(item: Order["items"][number]) {
  if (item.productName) return item.productName;
  return getProductName(item.product);
}

function productImage(item: Order["items"][number]) {
  return typeof item.product === "string" ? undefined : item.product.image;
}

function customerPhone(customer: Order["customer"]) {
  return typeof customer === "string" ? "-" : customer.phone || "-";
}

function customerAddress(customer: Order["customer"]) {
  return typeof customer === "string" ? "-" : customer.address || "-";
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, strong && styles.detailValueStrong]}
        numberOfLines={2}
      >
        {value}
      </Text>
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

function stepState(
  status: OrderStatus,
  index: number,
): "done" | "active" | "todo" {
  if (status === "cancelled" || status === "returned")
    return index === 0 ? "active" : "todo";
  const activeIndex =
    status === "delivered"
      ? 3
      : status === "approved"
        ? 1
        : status === "return_requested"
          ? 3
          : 0;
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "todo";
}

function statusIcon(status: OrderStatus): IconName {
  if (status === "delivered") return "truck-check-outline";
  if (status === "approved") return "check-decagram-outline";
  if (status === "cancelled" || status === "returned")
    return "close-circle-outline";
  if (status === "return_requested") return "backup-restore";
  return "clock-outline";
}

function statusTone(status: OrderStatus) {
  if (status === "delivered" || status === "approved")
    return toneColors("success");
  if (status === "cancelled" || status === "returned")
    return toneColors("danger");
  if (status === "return_requested") return toneColors("blue");
  return toneColors("warning");
}

function toneColors(tone: ToneName) {
  if (tone === "success")
    return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (tone === "warning")
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  if (tone === "danger")
    return { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  if (tone === "routeAlt")
    return { text: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" };
  if (tone === "violet")
    return { text: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" };
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
    paddingHorizontal: 16,
    paddingTop: 14,
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
  headerStatusIcon: {
    alignItems: "center",
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
  eyebrow: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
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
    fontWeight: "600",
  },
  customerName: {
    color: bento.text,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 25,
    marginTop: 5,
    maxWidth: 240,
  },
  statusPill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroAmount: {
    gap: 3,
  },
  amountLabelLight: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  amountHero: {
    color: bento.primaryDark,
    fontSize: 31,
    fontWeight: "700",
  },
  createdAt: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  timelineCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
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
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sectionTitle: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "700",
  },
  progressTrack: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 8,
    height: 8,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 8,
    height: "100%",
  },
  progressText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
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
    fontWeight: "600",
  },
  detailValue: {
    color: bento.text,
    flex: 1.25,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  detailValueStrong: {
    color: bento.primaryDark,
    fontSize: 15,
  },
  subSectionLabel: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "700",
  },
  productList: {
    gap: 10,
  },
  productRow: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
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
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  productFallback: {
    backgroundColor: bento.primarySoft,
  },
  productBody: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "700",
  },
  productMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  productSubtotal: {
    color: bento.text,
    fontSize: 12,
    fontWeight: "700",
  },
  returnBox: {
    gap: 12,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 6,
  },
  paymentMethod: {
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 9,
  },
  paymentMethodActive: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.primary,
  },
  paymentMethodText: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  paymentMethodActiveText: {
    color: bento.primaryDark,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  paymentQrBox: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  paymentQrHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  paymentQrIcon: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderColor: "#BFDBFE",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  paymentQrText: {
    flex: 1,
    minWidth: 0,
  },
  paymentQrTitle: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "700",
  },
  paymentQrSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  paymentQrBody: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  paymentQrImageWrap: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DBEAFE",
    borderRadius: 8,
    borderWidth: 1,
    height: 154,
    justifyContent: "center",
    padding: 10,
    width: 154,
  },
  paymentQrImage: {
    height: 132,
    width: 132,
  },
  paymentQrMeta: {
    flex: 1,
    gap: 4,
    minWidth: 150,
  },
  paymentQrLabel: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  paymentQrValue: {
    color: bento.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  paymentQrAmount: {
    color: bento.primaryDark,
    fontSize: 18,
    fontWeight: "700",
  },
  paymentQrError: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 6,
  },
  paymentQrLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: bento.primary,
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  paymentQrLinkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  paymentDoneBox: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  paymentDoneIcon: {
    alignItems: "center",
    backgroundColor: "#059669",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  paymentDoneText: {
    flex: 1,
    minWidth: 0,
  },
  paymentDoneTitle: {
    color: "#065F46",
    fontSize: 14,
    fontWeight: "700",
  },
  paymentDoneSubtitle: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
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
    fontWeight: "700",
  },
  actionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  refundHint: {
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
  modalKeyboard: {
    flex: 1,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.54)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  returnModalCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    maxHeight: "92%",
    maxWidth: 460,
    padding: 16,
    width: "100%",
    ...bentoSoftShadow,
  },
  returnModalTitle: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "700",
  },
  returnModalHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  returnModalScroll: {
    flexGrow: 0,
  },
  returnModalScrollContent: {
    gap: 12,
    paddingBottom: 2,
  },
  returnPreviewBox: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  returnPreviewTitle: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "700",
  },
  returnProductRow: {
    alignItems: "center",
    borderTopColor: bento.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
  },
  returnProductBody: {
    flex: 1,
    minWidth: 0,
  },
  returnProductName: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "700",
  },
  returnProductMeta: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  returnProductAmount: {
    color: bento.text,
    fontSize: 12,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalButton: {
    flex: 1,
    minWidth: 120,
  },
  pressed: {
    opacity: 0.72,
  },
});
