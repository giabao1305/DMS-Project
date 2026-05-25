import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Customer } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import { getCurrentPosition, type CurrentPosition } from "../visits/visitLocation";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "blue" | "warning" | "muted";

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
  const [customerType, setCustomerType] = useState(customer?.customerType || "");
  const [latitude, setLatitude] = useState(customer?.latitude ? String(customer.latitude) : "");
  const [longitude, setLongitude] = useState(customer?.longitude ? String(customer.longitude) : "");
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(customer);
  const canSubmit = useMemo(() => Boolean(name.trim() && phone.trim() && address.trim()), [address, name, phone]);

  const fillCurrentLocation = async () => {
    setGettingLocation(true);
    setError("");
    try {
      const currentPosition = await getCurrentPosition();
      setPosition(currentPosition);
      setLatitude(String(currentPosition.latitude));
      setLongitude(String(currentPosition.longitude));
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không lấy được vị trí hiện tại"));
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
      if (parsedLatitude !== undefined && (parsedLatitude < -90 || parsedLatitude > 90)) {
        setError("Vĩ độ phải nằm trong khoảng -90 đến 90.");
        return;
      }
      if (parsedLongitude !== undefined && (parsedLongitude < -180 || parsedLongitude > 180)) {
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
      const saved = customer ? await sellerApi.updateCustomer(customer._id, payload) : await sellerApi.createCustomer(payload);
      onSaved(saved);
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không lưu được khách hàng"));
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
            <Text style={styles.eyebrow}>{isEditMode ? "Cập nhật điểm bán" : "Tạo điểm bán"}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable onPress={submit} disabled={submitting || !canSubmit} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed, (submitting || !canSubmit) && styles.disabled]}>
            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="storefront-plus-outline" size={24} color={bento.primaryDark} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{isEditMode ? "Chỉnh hồ sơ điểm bán" : "Thêm điểm bán mới"}</Text>
            <Text style={styles.heroSub}>Điền thông tin chính xác để tạo đơn, check-in và phân tuyến nhanh hơn.</Text>
          </View>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.card}>
          <SectionHeader icon="clipboard-text-outline" title="Thông tin chính" tone="primary" />
          <MobileField required label="Tên điểm bán" value={name} onChangeText={setName} placeholder="Cửa hàng Minh Anh" icon="storefront-outline" />
          <MobileField required label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="Nhập số điện thoại" keyboardType="phone-pad" icon="phone-outline" />
          <MobileField required label="Địa chỉ" value={address} onChangeText={setAddress} placeholder="Nhập địa chỉ điểm bán" multiline icon="map-marker-outline" />
        </View>

        <View style={styles.card}>
          <SectionHeader icon="shape-outline" title="Phân loại" tone="blue" />
          <MobileField label="Chủ cửa hàng" value={ownerName} onChangeText={setOwnerName} placeholder="Tên người phụ trách" icon="account-outline" />
          <MobileField label="Nhóm khách" value={customerType} onChangeText={setCustomerType} placeholder="Tạp hóa, đại lý..." icon="tag-outline" />
        </View>

        <View style={styles.mapCard}>
          <View style={styles.locationTop}>
            <SectionHeader icon="crosshairs-gps" title="Tọa độ GPS" tone="success" />
            <Pressable onPress={fillCurrentLocation} disabled={gettingLocation} style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed, gettingLocation && styles.disabled]}>
              <MaterialCommunityIcons name="navigation-variant-outline" size={16} color="#FFFFFF" />
              <Text style={styles.gpsButtonText}>{gettingLocation ? "Đang lấy" : "Lấy GPS"}</Text>
            </Pressable>
          </View>

          <View style={[styles.mapBox, (position || latitude || longitude) && styles.mapBoxActive]}>
            <View style={styles.mapPinCircle}>
              <MaterialCommunityIcons name={position || latitude || longitude ? "map-marker-check" : "map-marker-off-outline"} size={30} color={position || latitude || longitude ? bento.success : bento.textMuted} />
            </View>
            <Text style={styles.mapText}>
              {position ? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : latitude && longitude ? `${latitude}, ${longitude}` : "Chưa có GPS"}
            </Text>
            <Text style={styles.mapSubText}>
              {position?.accuracy ? `Sai số khoảng ${Math.round(position.accuracy)}m` : "Dùng GPS để tối ưu tuyến và check-in"}
            </Text>
          </View>

          <View style={styles.twoCols}>
            <View style={styles.col}><MobileField label="Vĩ độ" value={latitude} onChangeText={setLatitude} keyboardType="numeric" icon="latitude" /></View>
            <View style={styles.col}><MobileField label="Kinh độ" value={longitude} onChangeText={setLongitude} keyboardType="numeric" icon="longitude" /></View>
          </View>
        </View>

        <Pressable onPress={submit} disabled={submitting || !canSubmit} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, (submitting || !canSubmit) && styles.disabled]}>
          <MaterialCommunityIcons name={submitting ? "loading" : "content-save-outline"} size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>{submitting ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Tạo điểm bán"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, tone }: { icon: IconName; title: string; tone: ToneName }) {
  const color = toneColors(tone);
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={19} color={color.text} />
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
      <View style={[styles.inputBox, isFilled && styles.inputBoxFilled, multiline && styles.inputBoxMultiline]}>
        <View style={[styles.inputIconBox, isFilled && styles.inputIconBoxFilled]}>
          <MaterialCommunityIcons name={icon} size={18} color={isFilled ? bento.primaryDark : bento.textMuted} />
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

function toneColors(tone: ToneName) {
  if (tone === "success") return { text: bento.success, bg: bento.successSoft, border: "#BDEEDB" };
  if (tone === "warning") return { text: bento.warning, bg: bento.warningSoft, border: "#FFE0A8" };
  if (tone === "blue") return { text: bento.route, bg: bento.routeSoft, border: "#CFE0FF" };
  if (tone === "muted") return { text: bento.textSecondary, bg: bento.surfaceAlt, border: bento.border };
  return { text: bento.primaryDark, bg: bento.primarySoft, border: bento.borderStrong };
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 24 },
  page: { alignSelf: "center", gap: 16, maxWidth: 430, paddingHorizontal: 20, paddingTop: 18, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 15, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "800" },
  title: { color: bento.text, fontSize: 24, fontWeight: "900", marginTop: 2 },
  heroCard: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 13, padding: 16, ...bentoSoftShadow },
  heroIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 18, borderWidth: 1, height: 52, justifyContent: "center", width: 52 },
  heroText: { flex: 1, minWidth: 0 },
  heroTitle: { color: bento.text, fontSize: 17, fontWeight: "900" },
  heroSub: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 4 },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  mapCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 24, borderWidth: 1, gap: 14, padding: 16, ...bentoSoftShadow },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  sectionIcon: { alignItems: "center", borderRadius: 14, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  field: { gap: 7 },
  labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  label: { color: bento.text, fontSize: 12, fontWeight: "900" },
  requiredMark: { color: bento.danger, fontSize: 12, fontWeight: "900" },
  inputBox: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 56, paddingHorizontal: 12 },
  inputBoxFilled: { backgroundColor: bento.surface, borderColor: bento.borderStrong },
  inputBoxMultiline: { alignItems: "flex-start", paddingTop: 12 },
  inputIconBox: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  inputIconBoxFilled: { backgroundColor: bento.primarySoft, borderColor: bento.borderStrong },
  input: { color: bento.text, flex: 1, fontSize: 14, fontWeight: "800", outlineStyle: "none" as never },
  textArea: { minHeight: 82, paddingTop: 6, textAlignVertical: "top" },
  locationTop: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  gpsButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 999, flexDirection: "row", gap: 5, minHeight: 40, paddingHorizontal: 12, ...bentoSoftShadow },
  gpsButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  mapBox: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 20, borderWidth: 1, gap: 7, justifyContent: "center", minHeight: 144, padding: 16 },
  mapBoxActive: { backgroundColor: bento.successSoft, borderColor: "#BDEEDB" },
  mapPinCircle: { alignItems: "center", backgroundColor: bento.surface, borderRadius: 999, height: 58, justifyContent: "center", width: 58, ...bentoSoftShadow },
  mapText: { color: bento.text, fontSize: 13, fontWeight: "900", marginTop: 6, textAlign: "center" },
  mapSubText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", textAlign: "center" },
  twoCols: { flexDirection: "row", gap: 10 },
  col: { flex: 1, minWidth: 0 },
  saveButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 16, flexDirection: "row", gap: 9, height: 54, justifyContent: "center", ...bentoSoftShadow },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
