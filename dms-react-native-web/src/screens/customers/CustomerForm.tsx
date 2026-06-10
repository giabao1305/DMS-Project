import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Customer } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import {
  getCurrentPosition,
  type CurrentPosition,
} from "../visits/visitLocation";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "blue" | "warning" | "muted";

const CUSTOMER_TYPE_OPTIONS = ["Đại lí", "Siêu thị mini", "Tạp hóa"];

export function CustomerForm({
  title,
  customer,
  onBack,
  onSaved,
}: {
  title: string;
  customer?: Customer;
  onBack: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [ownerName, setOwnerName] = useState(customer?.ownerName || "");
  const [customerType, setCustomerType] = useState(
    customer?.customerType || "",
  );
  const [latitude, setLatitude] = useState(
    customer?.latitude ? String(customer.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    customer?.longitude ? String(customer.longitude) : "",
  );
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(customer);
  const canSubmit = useMemo(
    () => Boolean(name.trim() && phone.trim() && address.trim()),
    [address, name, phone],
  );

  const fillCurrentLocation = async () => {
    setGettingLocation(true);
    setError("");
    try {
      const currentPosition = await getCurrentPosition();
      setPosition(currentPosition);
      setLatitude(String(currentPosition.latitude));
      setLongitude(String(currentPosition.longitude));
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không lấy được vị trí hiện tại",
        ),
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const parsedLatitude = parseOptionalCoordinate(latitude);
      const parsedLongitude = parseOptionalCoordinate(longitude);
      if ((parsedLatitude === undefined) !== (parsedLongitude === undefined)) {
        setError("Vui lòng nhập đủ cả vĩ độ và kinh độ, hoặc để trống cả hai.");
        return;
      }
      if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
        setError("Tọa độ GPS phải là số hợp lệ.");
        return;
      }
      if (
        parsedLatitude !== undefined &&
        (parsedLatitude < -90 || parsedLatitude > 90)
      ) {
        setError("Vĩ độ phải nằm trong khoảng -90 đến 90.");
        return;
      }
      if (
        parsedLongitude !== undefined &&
        (parsedLongitude < -180 || parsedLongitude > 180)
      ) {
        setError("Kinh độ phải nằm trong khoảng -180 đến 180.");
        return;
      }

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ownerName: ownerName.trim() || undefined,
        customerType: customerType.trim() || undefined,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      };
      const saved = customer
        ? await sellerApi.updateCustomer(customer._id, payload)
        : await sellerApi.createCustomer(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không lưu được khách hàng",
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
            <Text style={styles.eyebrow}>
              {isEditMode ? "Cập nhật khách hàng" : "Tạo khách hàng"}
            </Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable
            onPress={submit}
            disabled={submitting || !canSubmit}
            style={({ pressed }) => [
              styles.headerAction,
              pressed && styles.pressed,
              (submitting || !canSubmit) && styles.disabled,
            ]}
          >
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="storefront-plus-outline"
              size={24}
              color={bento.primaryDark}
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {isEditMode ? "Chỉnh hồ sơ khách hàng" : "Thêm khách hàng mới"}
            </Text>
            <Text style={styles.heroSub}>
              Điền đúng tên khách và cửa hàng để dữ liệu khớp với hệ thống web.
            </Text>
          </View>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.card}>
          <SectionHeader
            icon="clipboard-text-outline"
            title="Thông tin chính"
            tone="primary"
          />
          <MobileField
            required
            label="Tên khách hàng"
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên khách hàng"
            icon="account-outline"
          />
          <MobileField
            required
            label="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            icon="phone-outline"
          />
          <MobileField
            required
            label="Địa chỉ"
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ cửa hàng"
            multiline
            icon="map-marker-outline"
          />
        </View>

        <View style={styles.card}>
          <SectionHeader icon="shape-outline" title="Phân loại" tone="blue" />
          <MobileField
            label="Tên cửa hàng / điểm bán"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Nhập tên cửa hàng hoặc điểm bán"
            icon="storefront-outline"
          />
          <CustomerTypePicker value={customerType} onChange={setCustomerType} />
        </View>

        <View style={styles.mapCard}>
          <View style={styles.locationTop}>
            <SectionHeader
              icon="crosshairs-gps"
              title="Tọa độ GPS"
              tone="success"
            />
            <Pressable
              onPress={fillCurrentLocation}
              disabled={gettingLocation}
              style={({ pressed }) => [
                styles.gpsButton,
                pressed && styles.pressed,
                gettingLocation && styles.disabled,
              ]}
            >
              <MaterialCommunityIcons
                name="navigation-variant-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.gpsButtonText}>
                {gettingLocation ? "Đang lấy" : "Lấy GPS"}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.mapBox,
              (position || latitude || longitude) && styles.mapBoxActive,
            ]}
          >
            <View style={styles.mapPinCircle}>
              <MaterialCommunityIcons
                name={
                  position || latitude || longitude
                    ? "map-marker-check"
                    : "map-marker-off-outline"
                }
                size={30}
                color={
                  position || latitude || longitude
                    ? bento.success
                    : bento.textMuted
                }
              />
            </View>
            <Text style={styles.mapText}>
              {position
                ? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
                : latitude && longitude
                  ? `${latitude}, ${longitude}`
                  : "Chưa có GPS"}
            </Text>
            <Text style={styles.mapSubText}>
              {position?.accuracy
                ? `Sai số khoảng ${Math.round(position.accuracy)}m`
                : "Dùng GPS để tối ưu tuyến và check-in"}
            </Text>
          </View>

          <View style={styles.twoCols}>
            <View style={styles.col}>
              <MobileField
                label="Vĩ độ"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                icon="latitude"
              />
            </View>
            <View style={styles.col}>
              <MobileField
                label="Kinh độ"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                icon="longitude"
              />
            </View>
          </View>
        </View>

        <Pressable
          onPress={submit}
          disabled={submitting || !canSubmit}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
            (submitting || !canSubmit) && styles.disabled,
          ]}
        >
          <MaterialCommunityIcons
            name={submitting ? "loading" : "content-save-outline"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.saveButtonText}>
            {submitting
              ? "Đang lưu..."
              : isEditMode
                ? "Lưu thay đổi"
                : "Tạo khách hàng"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SectionHeader({
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
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: color.text, borderColor: color.text },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={19} color="#FFFFFF" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function parseOptionalCoordinate(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;
  const coordinate = Number(normalized);
  return Number.isFinite(coordinate) ? coordinate : Number.NaN;
}

function MobileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  icon,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  icon: IconName;
  required?: boolean;
}) {
  const isFilled = value.trim().length > 0;
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.requiredMark}>*</Text> : null}
      </View>
      <View
        style={[
          styles.inputBox,
          isFilled && styles.inputBoxFilled,
          multiline && styles.inputBoxMultiline,
        ]}
      >
        <View
          style={[styles.inputIconBox, isFilled && styles.inputIconBoxFilled]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={isFilled ? bento.primaryDark : bento.textMuted}
          />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={bento.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && styles.textArea]}
        />
      </View>
    </View>
  );
}

function CustomerTypePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasLegacyValue =
    value.trim().length > 0 && !CUSTOMER_TYPE_OPTIONS.includes(value);
  const selectedLabel = value || "Chọn nhóm khách";
  const options = hasLegacyValue
    ? [...CUSTOMER_TYPE_OPTIONS, value]
    : CUSTOMER_TYPE_OPTIONS;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Nhóm khách</Text>
      </View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.customerTypeTrigger,
          value && styles.customerTypeTriggerFilled,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.inputIconBox, value && styles.inputIconBoxFilled]}>
          <MaterialCommunityIcons
            name={value ? customerTypeIcon(value) : "tag-outline"}
            size={18}
            color={value ? bento.primaryDark : bento.textMuted}
          />
        </View>
        <View style={styles.customerTypeTriggerText}>
          <Text
            style={[
              styles.customerTypeValue,
              !value && styles.customerTypePlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={bento.textMuted}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.customerTypeModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Nhóm khách</Text>
                <Text style={styles.modalSubtitle}>Chọn loại điểm bán</Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={bento.textSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.customerTypeList}>
              {options.map((option) => {
                const selected = value === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.customerTypeRow,
                      selected && styles.customerTypeRowSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.customerTypeRowIcon,
                        selected && styles.customerTypeRowIconSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={customerTypeIcon(option)}
                        size={19}
                        color={
                          selected ? bento.primaryDark : bento.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.customerTypeRowText,
                        selected && styles.customerTypeRowTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {selected ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={bento.primaryDark}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function customerTypeIcon(option: string): IconName {
  if (option === "Đại lí") return "store-marker-outline";
  if (option === "Siêu thị mini") return "storefront-outline";
  return "store-outline";
}

function toneColors(tone: ToneName) {
  if (tone === "success")
    return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (tone === "warning")
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
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
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 430,
    paddingHorizontal: 20,
    paddingTop: 18,
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
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "600" },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 2 },
  heroCard: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
    ...bentoSoftShadow,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  heroText: { flex: 1, minWidth: 0 },
  heroTitle: { color: bento.text, fontSize: 17, fontWeight: "700" },
  heroSub: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
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
  mapCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  field: { gap: 7 },
  labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  label: { color: bento.text, fontSize: 12, fontWeight: "700" },
  requiredMark: { color: bento.danger, fontSize: 12, fontWeight: "700" },
  inputBox: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  inputBoxFilled: {
    backgroundColor: bento.surface,
    borderColor: bento.borderStrong,
  },
  inputBoxMultiline: { alignItems: "flex-start", paddingTop: 12 },
  inputIconBox: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  inputIconBoxFilled: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  input: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 0,
    outlineStyle: "none" as never,
  },
  textArea: { minHeight: 82, paddingTop: 6, textAlignVertical: "top" },
  customerTypeTrigger: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  customerTypeTriggerFilled: {
    backgroundColor: bento.surface,
    borderColor: bento.borderStrong,
  },
  customerTypeTriggerText: { flex: 1, minWidth: 0 },
  customerTypeValue: { color: bento.text, fontSize: 14, fontWeight: "700" },
  customerTypePlaceholder: { color: bento.textMuted },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.34)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  customerTypeModal: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    maxWidth: 390,
    padding: 16,
    width: "100%",
    ...bentoSoftShadow,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: { color: bento.text, fontSize: 17, fontWeight: "700" },
  modalSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  customerTypeList: { gap: 8 },
  customerTypeRow: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  customerTypeRowSelected: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  customerTypeRowIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  customerTypeRowIconSelected: {
    backgroundColor: bento.surface,
    borderColor: bento.borderStrong,
  },
  customerTypeRowText: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  customerTypeRowTextSelected: { color: bento.primaryDark },
  locationTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  gpsButton: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    flexDirection: "row",
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 12,
    ...bentoSoftShadow,
  },
  gpsButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  mapBox: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    justifyContent: "center",
    minHeight: 144,
    padding: 16,
  },
  mapBoxActive: { backgroundColor: bento.successSoft, borderColor: bento.borderStrong },
  mapPinCircle: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    width: 58,
    ...bentoSoftShadow,
  },
  mapText: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    maxWidth: "100%",
    textAlign: "center",
  },
  mapSubText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  twoCols: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  col: { flexBasis: 150, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  saveButton: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    flexDirection: "row",
    gap: 9,
    height: 54,
    justifyContent: "center",
    ...bentoSoftShadow,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
