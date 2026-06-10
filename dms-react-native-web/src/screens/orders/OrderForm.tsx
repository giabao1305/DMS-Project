import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { sellerApi } from "../../api/sellerApi";
import {
  EmptyState,
  ErrorBanner,
  Field,
  PrimaryButton,
} from "../../components/Ui";
import { bento, bentoShadow, bentoSoftShadow } from "../../theme";
import type {
  Customer,
  Order,
  OrderItem,
  Product,
  Promotion,
  Visit,
} from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import { currency, getCustomerName } from "../../utils/format";

type CartItem = {
  productId: string;
  productName: string;
  image?: string;
  price: number;
  stock: number;
  unit: string;
  quantity: number;
  subtotal: number;
};
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function OrderForm({
  title,
  order,
  customers,
  products,
  promotions,
  initialCustomerId,
  activeVisit,
  onCheckIn,
  onBack,
  onSaved,
}: {
  title: string;
  order?: Order;
  customers: Customer[];
  products: Product[];
  promotions: Promotion[];
  initialCustomerId?: string;
  activeVisit?: Visit;
  onCheckIn?: () => void;
  onBack: () => void;
  onSaved: (order: Order) => void;
}) {
  const [customerId, setCustomerId] = useState(
    getCustomerId(order?.customer) || initialCustomerId || "",
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPromotionId, setSelectedPromotionId] = useState(
    getPromotionId(order?.promotion),
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    buildInitialCart(order?.items || [], products),
  );
  const [note, setNote] = useState(order?.note || "");
  const [productQuery, setProductQuery] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const approvedCustomers = useMemo(
    () =>
      customers.filter(
        (customer) => customer.status === "approved" && customer.isActive,
      ),
    [customers],
  );
  const checkedInCustomer = useMemo(() => {
    if (order || !activeVisit) return undefined;
    return approvedCustomers.find(
      (customer) => customer._id === getCustomerId(activeVisit.customer),
    );
  }, [activeVisit, approvedCustomers, order]);
  const canOperate = Boolean(order || checkedInCustomer);
  const selectableCustomers = order
    ? approvedCustomers
    : checkedInCustomer
      ? [checkedInCustomer]
      : [];
  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive && product.stock > 0),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const keyword = productQuery.trim().toLowerCase();
    if (!keyword) return activeProducts;
    return activeProducts.filter((product) =>
      [
        product.name,
        product.code,
        product.unit,
        typeof product.category === "string"
          ? product.category
          : product.category?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [activeProducts, productQuery]);
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    [cartItems],
  );
  const selectedCustomer = useMemo(
    () => approvedCustomers.find((customer) => customer._id === customerId),
    [approvedCustomers, customerId],
  );
  const selectedPromotion = useMemo(
    () => promotions.find((promotion) => promotion._id === selectedPromotionId),
    [promotions, selectedPromotionId],
  );
  const discountAmount = useMemo(
    () => calculateDiscount(selectedPromotion, totalAmount),
    [selectedPromotion, totalAmount],
  );
  const finalAmount = totalAmount - discountAmount;
  const selectedProductIds = useMemo(
    () => new Set(cartItems.map((item) => item.productId)),
    [cartItems],
  );
  const nearestPromotion = useMemo(
    () => findNearestPromotion(promotions, totalAmount),
    [promotions, totalAmount],
  );
  const orderSummary = useMemo(() => {
    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    return { totalQuantity, totalLines: cartItems.length };
  }, [cartItems]);

  useEffect(() => {
    if (cartItems.length > 0 || products.length === 0 || !order?.items.length)
      return;
    setCartItems(buildInitialCart(order.items, products));
  }, [cartItems.length, order?.items, products]);

  useEffect(() => {
    if (!order) setCustomerId(checkedInCustomer?._id || "");
  }, [checkedInCustomer, order]);

  useEffect(() => {
    if (totalAmount <= 0) {
      setSelectedPromotionId("");
      return;
    }
    const currentPromotion = promotions.find(
      (promotion) => promotion._id === selectedPromotionId,
    );
    if (
      currentPromotion &&
      totalAmount >= (currentPromotion.minOrderValue || 0)
    )
      return;
    const bestPromotion = findBestPromotion(promotions, totalAmount);
    setSelectedPromotionId(bestPromotion?._id || "");
  }, [promotions, selectedPromotionId, totalAmount]);

  const addProduct = () => {
    setError("");
    if (!canOperate) {
      setError("Bạn cần check-in khách hàng trước khi thao tác đơn hàng.");
      return;
    }
    if (!selectedProductId) {
      setError("Vui lòng chọn sản phẩm.");
      return;
    }
    const product = activeProducts.find(
      (item) => item._id === selectedProductId,
    );
    if (!product) {
      setError("Sản phẩm không tồn tại hoặc đã hết hàng.");
      return;
    }
    if (cartItems.some((item) => item.productId === selectedProductId)) {
      setError("Sản phẩm đã có trong đơn.");
      return;
    }
    setCartItems((prev) => [
      ...prev,
      {
        productId: product._id,
        productName: product.name,
        image: product.image,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        quantity: 1,
        subtotal: product.price,
      },
    ]);
    setSelectedProductId("");
  };

  const updateQuantity = (productId: string, nextQuantity: number) => {
    if (!canOperate) return;
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const quantity = Math.min(Math.max(nextQuantity, 1), item.stock || 1);
        return { ...item, quantity, subtotal: item.price * quantity };
      }),
    );
  };

  const submit = async () => {
    if (
      !order &&
      (!checkedInCustomer || customerId !== checkedInCustomer._id)
    ) {
      setError("Bạn cần check-in tại khách hàng trước khi tạo đơn hàng.");
      return;
    }
    if (!customerId) {
      setError("Vui lòng chọn khách hàng.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        customer: customerId,
        promotion: selectedPromotionId || undefined,
        items: cartItems.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
        })),
        note: note || undefined,
      };
      const saved = order
        ? await sellerApi.updateOrder(order._id, payload)
        : await sellerApi.createOrder(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không lưu được đơn hàng",
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
            <Text style={styles.title}>{title}</Text>
          </View>
          <View
            style={[styles.headerAction, !order && styles.headerActionCreate]}
          >
            <MaterialCommunityIcons
              name={order ? "square-edit-outline" : "cart-plus"}
              size={20}
              color="#FFFFFF"
            />
          </View>
        </View>

        <ErrorBanner message={error} />

        {!order && !checkedInCustomer ? (
          <View style={styles.checkInAlert}>
            <View style={styles.checkInAlertIcon}>
              <MaterialCommunityIcons
                name="map-marker-alert-outline"
                size={21}
                color={bento.warning}
              />
            </View>
            <View style={styles.checkInAlertText}>
              <Text style={styles.checkInAlertTitle}>
                Bạn chưa check-in khách hàng
              </Text>
              <Text style={styles.checkInAlertDescription}>
                Check-in tại điểm bán trước khi tạo đơn. Đơn chỉ được ghi nhận
                cho khách đang ghé.
              </Text>
            </View>
            {onCheckIn ? (
              <Pressable
                onPress={onCheckIn}
                style={({ pressed }) => [
                  styles.checkInButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.checkInButtonText}>Check-in</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.customerCard}>
          <View style={styles.customerTop}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>
                {customerInitial(selectedCustomer)}
              </Text>
            </View>
            <View style={styles.customerText}>
              <Text style={styles.customerLabel}>
                {order ? "Khách hàng" : "Điểm bán đang ghé"}
              </Text>
              <Text style={styles.customerName} numberOfLines={1}>
                {selectedCustomer
                  ? getCustomerName(selectedCustomer)
                  : "Chọn điểm bán"}
              </Text>
              <Text style={styles.customerAddress} numberOfLines={1}>
                {selectedCustomer?.address ||
                  (order
                    ? "Chỉ hiển thị khách đã duyệt"
                    : "Khách hàng được xác định theo lượt check-in")}
              </Text>
            </View>
          </View>
          <SelectBox
            placeholder="Chọn điểm bán"
            value={customerId}
            options={selectableCustomers.map((customer) => ({
              id: customer._id,
              title: getCustomerName(customer),
              subtitle: `${customer.phone || "-"} · ${customer.address || "-"}`,
              icon: "storefront-outline",
            }))}
            onChange={setCustomerId}
            disabled={!order}
          />
        </View>

        <View style={styles.productSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Sản phẩm</Text>
              <Text style={styles.sectionHint}>
                Giá bán và tồn từ kho nhà phân phối
              </Text>
            </View>
            <Text style={styles.sectionMeta}>{cartItems.length} dòng</Text>
          </View>

          <ProductPicker
            products={filteredProducts}
            allProducts={activeProducts}
            query={productQuery}
            value={selectedProductId}
            selectedProductIds={selectedProductIds}
            totalProducts={activeProducts.length}
            onChange={setSelectedProductId}
            onQueryChange={setProductQuery}
            disabled={!canOperate}
          />
          <Pressable
            disabled={!canOperate}
            onPress={addProduct}
            style={({ pressed }) => [
              styles.addProductButton,
              pressed && styles.pressed,
              !canOperate && styles.disabled,
            ]}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addProductText}>Thêm sản phẩm</Text>
          </Pressable>

          <View style={styles.cartList}>
            {cartItems.length === 0 ? (
              <EmptyState
                title="Chưa chọn sản phẩm"
                message="Chọn một sản phẩm rồi bấm Thêm sản phẩm."
              />
            ) : (
              cartItems.map((item) => (
                <CartRow
                  key={item.productId}
                  item={item}
                  onMinus={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  onPlus={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  onChangeQuantity={(quantity) =>
                    updateQuantity(item.productId, quantity)
                  }
                  onRemove={() =>
                    setCartItems((prev) =>
                      prev.filter((row) => row.productId !== item.productId),
                    )
                  }
                  disabled={!canOperate}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon="ticket-percent-outline"
            title="Khuyến mãi & ghi chú"
            tone="violet"
          />
          <SelectBox
            placeholder="Không áp dụng khuyến mãi"
            value={selectedPromotionId}
            options={promotions.map((promotion) => ({
              id: promotion._id,
              title: promotion.name,
              subtitle: getPromotionOptionLabel(promotion, totalAmount),
              disabled: totalAmount < (promotion.minOrderValue || 0),
              icon: "ticket-percent-outline",
            }))}
            onChange={setSelectedPromotionId}
            allowClear
            disabled={!canOperate}
          />
          <PromotionInsight
            selectedPromotion={selectedPromotion}
            nearestPromotion={nearestPromotion}
            totalAmount={totalAmount}
            discountAmount={discountAmount}
          />
          <Field
            label="Ghi chú"
            value={note}
            onChangeText={setNote}
            placeholder="Nhập ghi chú cho đơn hàng"
            multiline
            editable={canOperate}
          />
        </View>

        <View style={styles.totalPanel}>
          <View style={styles.totalTop}>
            <View>
              <Text style={styles.totalLabel}>Thanh toán</Text>
              <Text style={styles.totalMain}>{currency(finalAmount)}</Text>
            </View>
            <View style={styles.totalIcon}>
              <MaterialCommunityIcons
                name="receipt-text-check-outline"
                size={23}
                color={bento.warning}
              />
            </View>
          </View>
          <View style={styles.totalRows}>
            <TotalRow
              label="Số dòng / số lượng"
              value={`${orderSummary.totalLines} dòng · ${orderSummary.totalQuantity} SP`}
            />
            <TotalRow label="Tổng tiền hàng" value={currency(totalAmount)} />
            <TotalRow label="Giảm giá" value={currency(discountAmount)} />
          </View>
          <View style={styles.totalActions}>
            <PrimaryButton
              label="Hủy"
              onPress={onBack}
              variant="ghost"
              icon="close"
              style={styles.totalButton}
            />
            <PrimaryButton
              label={order ? "Lưu đơn" : "Tạo đơn hàng"}
              onPress={submit}
              loading={submitting}
              disabled={!canOperate || !customerId || cartItems.length === 0}
              icon="cart-check"
              style={styles.totalButton}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
  tone = "primary",
}: {
  icon: IconName;
  title: string;
  tone?: "primary" | "violet";
}) {
  const colors =
    tone === "violet"
      ? { text: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" }
      : {
          text: bento.primaryDark,
          bg: bento.primarySoft,
          border: bento.borderStrong,
        };
  return (
    <View style={styles.sectionTitleRow}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: colors.text, borderColor: colors.text },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SelectBox({
  placeholder,
  value,
  options,
  onChange,
  allowClear,
  disabled,
}: {
  placeholder: string;
  value: string;
  options: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon: IconName;
    disabled?: boolean;
  }>;
  onChange: (value: string) => void;
  allowClear?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);
  return (
    <View style={styles.selectWrap}>
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          styles.selectTrigger,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        onPress={() => setOpen((current) => !current)}
      >
        <View style={styles.selectIcon}>
          <MaterialCommunityIcons
            name={selected?.icon || "chevron-down"}
            size={18}
            color={bento.primaryDark}
          />
        </View>
        <View style={styles.selectText}>
          <Text
            style={[styles.selectTitle, !selected && styles.placeholder]}
            numberOfLines={1}
          >
            {selected?.title || placeholder}
          </Text>
          {selected?.subtitle ? (
            <Text style={styles.selectSubtitle} numberOfLines={1}>
              {selected.subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={bento.textMuted}
        />
      </Pressable>
      {open && !disabled ? (
        <View style={styles.optionPanel}>
          {allowClear ? (
            <OptionRow
              title={placeholder}
              subtitle="Không chọn"
              icon="close-circle-outline"
              selected={!value}
              onPress={() => {
                onChange("");
                setOpen(false);
              }}
            />
          ) : null}
          {options.length === 0 ? (
            <Text style={styles.muted}>Không có dữ liệu</Text>
          ) : null}
          {options.map((option) => (
            <OptionRow
              key={option.id}
              title={option.title}
              subtitle={option.subtitle}
              icon={option.icon}
              selected={option.id === value}
              disabled={option.disabled}
              onPress={() => {
                if (option.disabled) return;
                onChange(option.id);
                setOpen(false);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function OptionRow({
  title,
  subtitle,
  icon,
  selected,
  disabled,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionRow,
        selected && styles.optionSelected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.optionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={selected ? bento.primaryDark : bento.textSecondary}
        />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.optionSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <MaterialCommunityIcons
          name="check-circle"
          size={18}
          color={bento.primaryDark}
        />
      ) : null}
    </Pressable>
  );
}

function PromotionInsight({
  selectedPromotion,
  nearestPromotion,
  totalAmount,
  discountAmount,
}: {
  selectedPromotion?: Promotion;
  nearestPromotion?: Promotion;
  totalAmount: number;
  discountAmount: number;
}) {
  if (totalAmount <= 0) {
    return (
      <View style={styles.promoInsight}>
        <MaterialCommunityIcons
          name="ticket-percent-outline"
          size={19}
          color={bento.textMuted}
        />
        <View style={styles.promoInsightText}>
          <Text style={styles.promoInsightTitle}>
            Chọn sản phẩm để kiểm tra ưu đãi
          </Text>
          <Text style={styles.promoInsightSubtitle}>
            Hệ thống sẽ tự gợi ý khuyến mãi phù hợp nhất.
          </Text>
        </View>
      </View>
    );
  }
  if (selectedPromotion && discountAmount > 0) {
    return (
      <View style={[styles.promoInsight, styles.promoInsightActive]}>
        <MaterialCommunityIcons
          name="check-decagram"
          size={20}
          color={bento.success}
        />
        <View style={styles.promoInsightText}>
          <Text style={styles.promoInsightTitle}>
            Đang áp dụng: {selectedPromotion.name}
          </Text>
          <Text style={styles.promoInsightSubtitle}>
            Tiết kiệm {currency(discountAmount)} cho đơn này.
          </Text>
        </View>
      </View>
    );
  }
  if (nearestPromotion) {
    const missingAmount = getPromotionMissingAmount(
      nearestPromotion,
      totalAmount,
    );
    return (
      <View style={[styles.promoInsight, styles.promoInsightWarning]}>
        <MaterialCommunityIcons
          name="lightbulb-on-outline"
          size={20}
          color={bento.warning}
        />
        <View style={styles.promoInsightText}>
          <Text style={styles.promoInsightTitle}>
            Còn thiếu {currency(missingAmount)} để nhận ưu đãi
          </Text>
          <Text style={styles.promoInsightSubtitle}>
            {nearestPromotion.name} · {getPromotionLabel(nearestPromotion)}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.promoInsight}>
      <MaterialCommunityIcons
        name="ticket-outline"
        size={19}
        color={bento.textMuted}
      />
      <View style={styles.promoInsightText}>
        <Text style={styles.promoInsightTitle}>Chưa có khuyến mãi phù hợp</Text>
        <Text style={styles.promoInsightSubtitle}>
          Có thể tạo đơn không khuyến mãi.
        </Text>
      </View>
    </View>
  );
}

function ProductPicker({
  products,
  allProducts,
  value,
  query,
  selectedProductIds,
  totalProducts,
  onChange,
  onQueryChange,
  disabled,
}: {
  products: Product[];
  allProducts: Product[];
  value: string;
  query: string;
  selectedProductIds: Set<string>;
  totalProducts: number;
  onChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = allProducts.find((product) => product._id === value);
  return (
    <View style={styles.selectWrap}>
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          styles.productPicker,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        onPress={() => setOpen((current) => !current)}
      >
        <ProductThumb product={selected} />
        <View style={styles.selectText}>
          <Text
            style={[styles.selectTitle, !selected && styles.placeholder]}
            numberOfLines={1}
          >
            {selected?.name || "Tìm/chọn sản phẩm"}
          </Text>
          <Text style={styles.selectSubtitle} numberOfLines={1}>
            {selected
              ? `${currency(selected.price)} · tồn ${selected.stock} ${selected.unit}`
              : "Có ảnh, giá và tồn kho"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={bento.textMuted}
        />
      </Pressable>
      {open && !disabled ? (
        <View style={styles.productList}>
          <View style={styles.productSearchBox}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={bento.textMuted}
            />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              placeholder="Tìm tên, mã, nhóm sản phẩm"
              placeholderTextColor={bento.textMuted}
              style={styles.productSearchInput}
            />
            {query ? (
              <Pressable onPress={() => onQueryChange("")} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={bento.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.productResultText}>
            {products.length}/{totalProducts} sản phẩm còn hàng
          </Text>
          {products.length === 0 ? (
            <Text style={styles.muted}>Không có sản phẩm phù hợp</Text>
          ) : null}
          {products.map((product) => {
            const alreadyInCart = selectedProductIds.has(product._id);
            const lowStock =
              product.stock <= Math.max(product.minStock || 0, 5);
            return (
              <Pressable
                key={product._id}
                onPress={() => {
                  if (alreadyInCart) return;
                  onChange(product._id);
                  setOpen(false);
                }}
                disabled={alreadyInCart}
                style={({ pressed }) => [
                  styles.productOption,
                  product._id === value && styles.productOptionSelected,
                  pressed && styles.pressed,
                  alreadyInCart && styles.disabled,
                ]}
              >
                <ProductThumb product={product} />
                <View style={styles.productOptionBody}>
                  <Text style={styles.productOptionTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productOptionMeta} numberOfLines={1}>
                    {product.code} · tồn {product.stock} {product.unit}
                  </Text>
                  <View style={styles.productBadges}>
                    {alreadyInCart ? (
                      <Text
                        style={[styles.productBadge, styles.productBadgeMuted]}
                      >
                        Đã chọn
                      </Text>
                    ) : null}
                    {lowStock ? (
                      <Text
                        style={[
                          styles.productBadge,
                          styles.productBadgeWarning,
                        ]}
                      >
                        Tồn thấp
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.productOptionPrice}>
                  {currency(product.price)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function ProductThumb({ product }: { product?: Product }) {
  if (product?.image)
    return (
      <Image
        source={{ uri: product.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
    );
  return (
    <View style={[styles.productImage, styles.productFallback]}>
      <MaterialCommunityIcons
        name="package-variant-closed"
        size={19}
        color={bento.primaryDark}
      />
    </View>
  );
}

function CartRow({
  item,
  onMinus,
  onPlus,
  onChangeQuantity,
  onRemove,
  disabled,
}: {
  item: CartItem;
  onMinus: () => void;
  onPlus: () => void;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [draftQuantity, setDraftQuantity] = useState(String(item.quantity));
  useEffect(() => setDraftQuantity(String(item.quantity)), [item.quantity]);
  const commitQuantity = (value: string) => {
    const parsed = Number(value);
    const maxQuantity = item.stock || 1;
    const quantity = Number.isFinite(parsed)
      ? Math.min(Math.max(Math.trunc(parsed), 1), maxQuantity)
      : 1;
    setDraftQuantity(String(quantity));
    onChangeQuantity(quantity);
  };
  const handleQuantityInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setDraftQuantity(digitsOnly);
    if (digitsOnly) commitQuantity(digitsOnly);
  };
  return (
    <View style={styles.cartRow}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.cartImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cartImage, styles.productFallback]}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={20}
            color={bento.primaryDark}
          />
        </View>
      )}
      <View style={styles.cartBody}>
        <Text style={styles.cartTitle} numberOfLines={2}>
          {item.productName}
        </Text>
        <Text style={styles.cartMeta}>
          {currency(item.price)} · tồn {item.stock} {item.unit}
        </Text>
        <Text style={styles.cartSubtotal}>{currency(item.subtotal)}</Text>
      </View>
      <View style={styles.quantityBox}>
        <View style={styles.stepper}>
          <Pressable
            onPress={onMinus}
            disabled={disabled || item.quantity <= 1}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.pressed,
              (disabled || item.quantity <= 1) && styles.disabled,
            ]}
          >
            <MaterialCommunityIcons name="minus" size={16} color={bento.text} />
          </Pressable>
          <TextInput
            editable={!disabled}
            value={draftQuantity}
            onChangeText={handleQuantityInput}
            onBlur={() => commitQuantity(draftQuantity)}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            selectTextOnFocus
            style={[styles.quantityInput, disabled && styles.disabled]}
          />
          <Pressable
            onPress={onPlus}
            disabled={disabled || item.quantity >= (item.stock || 1)}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.pressed,
              (disabled || item.quantity >= (item.stock || 1)) &&
                styles.disabled,
            ]}
          >
            <MaterialCommunityIcons name="plus" size={16} color={bento.text} />
          </Pressable>
        </View>
        <Pressable
          disabled={disabled}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={bento.danger}
          />
        </Pressable>
      </View>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalRowLabel}>{label}</Text>
      <Text style={styles.totalRowValue}>{value}</Text>
    </View>
  );
}

function buildInitialCart(items: OrderItem[], products: Product[]): CartItem[] {
  return items.map((item) => {
    const product =
      typeof item.product === "string"
        ? products.find((productItem) => productItem._id === item.product)
        : item.product;
    const productId =
      typeof item.product === "string" ? item.product : item.product._id;
    const price = item.price || product?.price || 0;
    const quantity = item.quantity || 1;
    return {
      productId,
      productName: product?.name || item.productName || "Sản phẩm",
      image: product?.image,
      price,
      stock: product?.stock || quantity,
      unit: product?.unit || "",
      quantity,
      subtotal: item.subtotal || price * quantity,
    };
  });
}

function getCustomerId(customer?: string | Customer) {
  return !customer
    ? ""
    : typeof customer === "string"
      ? customer
      : customer._id;
}
function getPromotionId(promotion?: string | Promotion) {
  return !promotion
    ? ""
    : typeof promotion === "string"
      ? promotion
      : promotion._id;
}
function calculateDiscount(promotion: Promotion | undefined, total: number) {
  if (!promotion || total < (promotion.minOrderValue || 0)) return 0;
  if (promotion.type === "percent")
    return Math.min(total, (total * (promotion.discountPercent || 0)) / 100);
  if (promotion.type === "amount")
    return Math.min(total, promotion.discountAmount || 0);
  return 0;
}
function findBestPromotion(promotions: Promotion[], total: number) {
  const eligiblePromotions = promotions.filter(
    (promotion) =>
      promotion.isActive && total >= (promotion.minOrderValue || 0),
  );
  if (eligiblePromotions.length === 0) return undefined;
  return eligiblePromotions.reduce(
    (best, promotion) =>
      calculateDiscount(promotion, total) > calculateDiscount(best, total)
        ? promotion
        : best,
    eligiblePromotions[0],
  );
}
function findNearestPromotion(promotions: Promotion[], total: number) {
  const lockedPromotions = promotions.filter(
    (promotion) =>
      promotion.isActive && getPromotionMissingAmount(promotion, total) > 0,
  );
  if (lockedPromotions.length === 0) return undefined;
  return lockedPromotions.reduce(
    (nearest, promotion) =>
      getPromotionMissingAmount(promotion, total) <
      getPromotionMissingAmount(nearest, total)
        ? promotion
        : nearest,
    lockedPromotions[0],
  );
}
function getPromotionMissingAmount(promotion: Promotion, total: number) {
  return Math.max((promotion.minOrderValue || 0) - total, 0);
}
function getPromotionLabel(promotion: Promotion) {
  const condition = promotion.minOrderValue
    ? `Đơn từ ${currency(promotion.minOrderValue)}`
    : "Không điều kiện tối thiểu";
  if (promotion.type === "percent")
    return `Giảm ${promotion.discountPercent || 0}% · ${condition}`;
  if (promotion.type === "amount")
    return `Giảm ${currency(promotion.discountAmount || 0)} · ${condition}`;
  return `Tặng sản phẩm · ${condition}`;
}
function getPromotionOptionLabel(promotion: Promotion, total: number) {
  const missingAmount = getPromotionMissingAmount(promotion, total);
  if (missingAmount > 0)
    return `${getPromotionLabel(promotion)} · còn thiếu ${currency(missingAmount)}`;
  return `${getPromotionLabel(promotion)} · đủ điều kiện`;
}
function compactMoney(value: number) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`;
  return currency(value);
}
function customerInitial(customer?: Customer) {
  return (customer?.name || "K").trim().slice(0, 1).toUpperCase();
}
function toneStyle(tone: "success" | "blue" | "warning") {
  if (tone === "success") return { text: "#059669", bg: "#ECFDF5" };
  if (tone === "blue") return { text: "#0891B2", bg: "#ECFEFF" };
  return { text: "#D97706", bg: "#FFFBEB" };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 430,
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
  headerActionCreate: {},
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  checkInAlert: {
    alignItems: "center",
    backgroundColor: bento.warningSoft,
    borderColor: "#F7D99A",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  checkInAlertIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  checkInAlertText: { flex: 1, minWidth: 0 },
  checkInAlertTitle: { color: bento.text, fontSize: 13, fontWeight: "700" },
  checkInAlertDescription: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: 3,
  },
  checkInButton: {
    backgroundColor: bento.route,
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  checkInButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  customerCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
    ...bentoSoftShadow,
  },
  customerTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  customerAvatar: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  customerInitial: {
    color: bento.primaryDark,
    fontSize: 22,
    fontWeight: "700",
  },
  customerText: { flex: 1, minWidth: 0 },
  customerLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  customerName: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  customerAddress: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  productSection: { gap: 12 },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitleRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  sectionHint: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  sectionMeta: { color: bento.primaryDark, fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
    ...bentoSoftShadow,
  },
  selectWrap: { gap: 8 },
  selectTrigger: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    padding: 12,
  },
  productPicker: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 62,
    padding: 10,
    ...bentoSoftShadow,
  },
  selectIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  selectText: { flex: 1, minWidth: 0 },
  selectTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  placeholder: { color: bento.textMuted },
  selectSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  optionPanel: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 8,
    ...bentoSoftShadow,
  },
  optionRow: {
    alignItems: "center",
    borderRadius: 6,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    padding: 8,
  },
  optionSelected: { backgroundColor: bento.primarySoft },
  optionIcon: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  optionText: { flex: 1, minWidth: 0 },
  optionTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  optionSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
  productList: { gap: 8 },
  productSearchBox: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 11,
  },
  productSearchInput: {
    color: bento.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    minWidth: 0,
    outlineStyle: "none" as never,
  },
  productResultText: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  productOption: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 66,
    padding: 9,
  },
  productOptionSelected: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  productImage: { borderRadius: 8, height: 48, width: 48 },
  productFallback: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    justifyContent: "center",
  },
  productOptionBody: { flex: 1, minWidth: 0 },
  productOptionTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  productOptionMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  productBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
  },
  productBadge: {
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  productBadgeMuted: {
    backgroundColor: bento.surfaceAlt,
    color: bento.textSecondary,
  },
  productBadgeWarning: {
    backgroundColor: bento.warningSoft,
    color: bento.warning,
  },
  productOptionPrice: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  addProductButton: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    flexDirection: "row",
    gap: 7,
    height: 48,
    justifyContent: "center",
    ...bentoSoftShadow,
  },
  addProductText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  cartList: { gap: 10 },
  cartRow: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
    padding: 12,
    ...bentoSoftShadow,
  },
  cartImage: { borderRadius: 8, height: 56, width: 56 },
  cartBody: { flex: 1, minWidth: 145 },
  cartTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  cartMeta: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  cartSubtotal: {
    color: bento.primaryDark,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  quantityBox: { alignItems: "center", flexDirection: "row", gap: 6 },
  stepper: { alignItems: "center", flexDirection: "row", gap: 4 },
  stepperButton: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: bento.dangerSoft,
    borderColor: "#FFCACA",
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  quantityInput: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 10,
    borderWidth: 1,
    color: bento.text,
    fontSize: 14,
    fontWeight: "600",
    height: 34,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlign: "center",
  },
  promoInsight: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  promoInsightActive: {
    backgroundColor: bento.successSoft,
    borderColor: "#BFEEDB",
  },
  promoInsightWarning: {
    backgroundColor: bento.warningSoft,
    borderColor: "#F7D99A",
  },
  promoInsightText: { flex: 1, minWidth: 0 },
  promoInsightTitle: { color: bento.text, fontSize: 13, fontWeight: "700" },
  promoInsightSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  totalPanel: {
    backgroundColor: "#D97706",
    borderRadius: 8,
    gap: 14,
    padding: 16,
    ...bentoShadow,
  },
  totalTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    fontWeight: "600",
  },
  totalMain: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 3,
  },
  totalIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  totalRows: { gap: 8 },
  totalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalRowLabel: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 12,
    fontWeight: "700",
  },
  totalRowValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  totalActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  totalButton: { flex: 1, minWidth: 130 },
  muted: {
    color: bento.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    padding: 8,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
