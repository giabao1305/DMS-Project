import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner } from "../../components/Ui";
import { bento, bentoShadow, bentoSoftShadow } from "../../theme";
import type { Customer, RoutePlan } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import { getCustomerId, getCustomerName, statusLabel } from "../../utils/format";
import { getCurrentPosition, type CurrentPosition } from "./visitLocation";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName = "primary" | "success" | "warning" | "danger" | "blue" | "muted";
type ChoiceOption = { id: string; label: string; status?: string; note?: string; address?: string; latitude?: number; longitude?: number };
type GpsStatus = { key: string; title: string; message: string; icon: IconName; tone: ToneName; canCheckIn: boolean };

const CHECK_IN_RADIUS_METERS = 300;
const WEAK_GPS_ACCURACY_METERS = 100;

export function VisitCreate({
  customers,
  routes,
  initialCustomerId,
  initialRouteId,
  onBack,
  onSaved,
}: {
  customers: Customer[];
  routes: RoutePlan[];
  initialCustomerId?: string;
  initialRouteId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [customerId, setCustomerId] = useState(initialCustomerId || "");
  const [routeId, setRouteId] = useState(initialRouteId || "");
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<CurrentPosition | null>(null);

  const selectedRoute = useMemo(() => routes.find((route) => route._id === routeId), [routes, routeId]);
  const routeOptions = useMemo<ChoiceOption[]>(() => {
    if (!selectedRoute) return [];
    return selectedRoute.customers
      .map((item) => {
        const id = getCustomerId(item.customer);
        const fallback = customers.find((customer) => customer._id === id);
        const customer = typeof item.customer === "string" ? fallback : item.customer || fallback;
        return {
          id,
          label: getCustomerName(customer || item.customer),
          status: item.status,
          note: item.note,
          address: typeof customer === "string" ? "" : customer?.address,
          latitude: typeof customer === "string" ? undefined : customer?.latitude,
          longitude: typeof customer === "string" ? undefined : customer?.longitude,
        };
      })
      .filter((item) => Boolean(item.id && !isVisitedRouteCustomer(item.status))) as ChoiceOption[];
  }, [customers, selectedRoute]);

  const customerOptions = useMemo<ChoiceOption[]>(() => {
    if (selectedRoute) return routeOptions;
    return customers
      .filter((customer) => customer.status === "approved" && customer.isActive)
      .map((customer) => ({ id: customer._id, label: customer.name, address: customer.address, status: customer.status, latitude: customer.latitude, longitude: customer.longitude }));
  }, [customers, routeOptions, selectedRoute]);

  const selectedCustomer = customerOptions.find((item) => item.id === customerId);
  const gpsStatus = gettingLocation ? loadingGpsStatus() : getGpsStatus({ selectedCustomer, latitude, longitude, position, error });
  const distanceToCustomer = getDistanceToCustomer(selectedCustomer, latitude, longitude);
  const canSubmit = Boolean(customerId && latitude && longitude && gpsStatus.canCheckIn && !submitting);

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

  const checkIn = async () => {
    const checkInLatitude = parseCoordinate(latitude);
    const checkInLongitude = parseCoordinate(longitude);
    if (checkInLatitude === undefined || checkInLongitude === undefined) {
      setError("Vui lòng lấy hoặc nhập tọa độ GPS hợp lệ trước khi check-in.");
      return;
    }
    if (checkInLatitude < -90 || checkInLatitude > 90 || checkInLongitude < -180 || checkInLongitude > 180) {
      setError("Tọa độ GPS không nằm trong phạm vi hợp lệ.");
      return;
    }
    if (!gpsStatus.canCheckIn) {
      setError(gpsStatus.message);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await sellerApi.checkIn({ customer: customerId, route: routeId || undefined, checkInLatitude, checkInLongitude, gpsAccuracy: position?.accuracy, note: note.trim() || undefined });
      onSaved();
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không check-in được"));
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
            <Text style={styles.eyebrow}>CHECK-IN GPS</Text>
            <Text style={styles.title}>Bắt đầu ghé thăm</Text>
          </View>
          <Pressable onPress={fillCurrentLocation} disabled={gettingLocation} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed, gettingLocation && styles.disabled]}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#fff" />
          </Pressable>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.mapCard}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 8 }).map((_, index) => <View key={`v-${index}`} style={[styles.mapLineV, { left: `${12 + index * 12}%` }]} />)}
            {Array.from({ length: 6 }).map((_, index) => <View key={`h-${index}`} style={[styles.mapLineH, { top: `${12 + index * 15}%` }]} />)}
          </View>
          <View style={styles.gpsHaloOuter} />
          <View style={styles.gpsHaloInner} />
          <View style={[styles.gpsDot, { backgroundColor: toneColors(gpsStatus.tone).text }]}>
            <MaterialCommunityIcons name={gpsStatus.icon} size={26} color="#fff" />
          </View>
          <View style={[styles.mapPin, styles.mapPinOne]}><MaterialCommunityIcons name="map-marker" size={22} color={bento.route} /></View>
          <View style={[styles.mapPin, styles.mapPinTwo]}><MaterialCommunityIcons name="map-marker" size={22} color={bento.primary} /></View>
          <View style={[styles.mapPin, styles.mapPinThree]}><MaterialCommunityIcons name="map-marker" size={22} color={bento.warning} /></View>
          <View style={styles.mapTopPill}>
            <MaterialCommunityIcons name="navigation-variant-outline" size={16} color={toneColors(gpsStatus.tone).text} />
            <Text style={styles.mapTopText}>{gpsStatus.title}</Text>
          </View>
          <View style={styles.mapSheet}>
            <View style={styles.customerAvatar}>
              <MaterialCommunityIcons name="storefront-outline" size={21} color="#fff" />
            </View>
            <View style={styles.sheetText}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{selectedCustomer?.label || "Chọn điểm bán cần check-in"}</Text>
              <Text style={styles.sheetSub} numberOfLines={1}>{selectedCustomer?.address || selectedRoute?.name || "Bạn có muốn check-in tại đây?"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader icon="map-marker-path" title="Tuyến & điểm bán" subtitle="Chọn điểm bán trong tuyến hoặc check-in ngoài tuyến." tone="primary" />
          <RouteSelector
            value={routeId}
            routes={routes}
            onChange={(value) => {
              setRouteId(value);
              setCustomerId("");
            }}
          />
          <CustomerDropdown label={selectedRoute ? "Điểm bán trong tuyến" : "Khách hàng"} value={customerId} options={customerOptions} onChange={setCustomerId} />
        </View>

        <View style={styles.card}>
          <View style={styles.gpsHeader}>
            <SectionHeader icon="crosshairs-gps" title="Vị trí GPS" subtitle="Lấy vị trí hiện tại để ghi nhận check-in." tone="success" />
            <Pressable onPress={fillCurrentLocation} disabled={gettingLocation} style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed, gettingLocation && styles.disabled]}>
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#fff" />
              <Text style={styles.gpsButtonText}>{gettingLocation ? "Đang lấy" : "Lấy GPS"}</Text>
            </Pressable>
          </View>
          <GpsStatusCard status={gpsStatus} distance={distanceToCustomer} />
          {position ? (
            <View style={styles.locationBox}>
              <View style={styles.locationIcon}><MaterialCommunityIcons name="map-marker-check-outline" size={18} color={bento.success} /></View>
              <View style={styles.locationTextBlock}>
                <Text style={styles.locationTitle}>GPS hiện tại</Text>
                <Text style={styles.locationText}>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}{position.accuracy ? ` - sai số ${Math.round(position.accuracy)}m` : ""}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.coordinateRow}>
            <MobileField label="Vĩ độ" value={latitude} onChangeText={setLatitude} keyboardType="numeric" placeholder="10.762622" />
            <MobileField label="Kinh độ" value={longitude} onChangeText={setLongitude} keyboardType="numeric" placeholder="106.660172" />
          </View>
          <MobileField label="Ghi chú" value={note} onChangeText={setNote} multiline placeholder="Tồn kho, trưng bày, nhu cầu đặt hàng..." />
          <Pressable onPress={checkIn} disabled={!canSubmit} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, !canSubmit && styles.disabled]}>
            <MaterialCommunityIcons name="map-marker-check" size={20} color="#fff" />
            <Text style={styles.submitText}>{submitting ? "Đang check-in..." : "Check-in ngay"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, subtitle, tone }: { icon: IconName; title: string; subtitle: string; tone: ToneName }) {
  const color = toneColors(tone);
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color.bg, borderColor: color.border }]}><MaterialCommunityIcons name={icon} size={19} color={color.text} /></View>
      <View style={styles.sectionText}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSub}>{subtitle}</Text></View>
    </View>
  );
}

function GpsStatusCard({ status, distance }: { status: GpsStatus; distance?: number }) {
  const color = toneColors(status.tone);
  return (
    <View style={[styles.statusCard, { backgroundColor: color.bg, borderColor: color.border }]}>
      <View style={[styles.statusIcon, { backgroundColor: bento.surface }]}>
        <MaterialCommunityIcons name={status.icon} size={20} color={color.text} />
      </View>
      <View style={styles.statusTextBlock}>
        <Text style={styles.statusTitle}>{status.title}</Text>
        <Text style={styles.statusMessage}>{status.message}</Text>
        {typeof distance === "number" ? <Text style={styles.statusDistance}>Cách điểm bán khoảng {formatDistance(distance)}</Text> : null}
      </View>
    </View>
  );
}

function RouteSelector({ value, routes, onChange }: { value: string; routes: RoutePlan[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = routes.find((route) => route._id === value);
  const filteredRoutes = routes.filter((route) => matchesQuery(`${route.name} ${statusLabel(route.status)}`, query));

  return (
    <View style={styles.dropdownGroup}>
      <Text style={styles.choiceLabel}>Tuyến ghé</Text>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.dropdownButton, pressed && styles.pressed]}>
        <View style={styles.dropdownIcon}><MaterialCommunityIcons name="map-marker-path" size={18} color={bento.primary} /></View>
        <View style={styles.dropdownTextBlock}>
          <Text style={styles.dropdownValue} numberOfLines={1}>{selected?.name || "Ngoài tuyến"}</Text>
          <Text style={styles.dropdownHint}>{selected ? statusLabel(selected.status) : "Check-in không theo tuyến"}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={22} color={bento.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tuyến ghé</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.modalClose}><MaterialCommunityIcons name="close" size={20} color={bento.text} /></Pressable>
            </View>
            <View style={styles.modalSearch}>
              <MaterialCommunityIcons name="magnify" size={19} color={bento.textMuted} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Tìm tên tuyến..." placeholderTextColor={bento.textMuted} style={styles.modalSearchInput} />
            </View>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              <Pressable onPress={() => { onChange(""); setOpen(false); setQuery(""); }} style={({ pressed }) => [styles.dropdownOption, !value && styles.dropdownOptionActive, pressed && styles.pressed]}>
                <View style={[styles.optionIcon, !value && styles.optionIconActive]}><MaterialCommunityIcons name="map-marker-off-outline" size={17} color={!value ? "#fff" : bento.primary} /></View>
                <View style={styles.optionTextBlock}>
                  <Text style={[styles.optionTitle, !value && styles.optionTitleActive]}>Ngoài tuyến</Text>
                  <Text style={styles.optionSub}>Check-in không theo kế hoạch tuyến</Text>
                </View>
              </Pressable>
              {filteredRoutes.length === 0 ? <Text style={styles.muted}>Không tìm thấy tuyến phù hợp</Text> : filteredRoutes.map((route) => {
                const active = route._id === value;
                return (
                  <Pressable key={route._id} onPress={() => { onChange(route._id); setOpen(false); setQuery(""); }} style={({ pressed }) => [styles.dropdownOption, active && styles.dropdownOptionActive, pressed && styles.pressed]}>
                    <View style={[styles.optionIcon, active && styles.optionIconActive]}><MaterialCommunityIcons name="map-marker-path" size={17} color={active ? "#fff" : bento.primary} /></View>
                    <View style={styles.optionTextBlock}>
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]} numberOfLines={1}>{route.name}</Text>
                      <Text style={styles.optionSub}>{statusLabel(route.status)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CustomerDropdown({ label, value, options, onChange }: { label: string; value: string; options: ChoiceOption[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((item) => item.id === value);
  const filteredOptions = options.filter((option) => matchesQuery(`${option.label} ${option.address || ""} ${option.note || ""}`, query));
  return (
    <View style={styles.dropdownGroup}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.dropdownButton, pressed && styles.pressed]}>
        <View style={styles.dropdownIcon}><MaterialCommunityIcons name="storefront-outline" size={18} color={bento.primary} /></View>
        <View style={styles.dropdownTextBlock}>
          <Text style={[styles.dropdownValue, !selected && styles.dropdownPlaceholder]} numberOfLines={1}>{selected ? selected.label : "Chọn khách hàng"}</Text>
          <Text style={styles.dropdownHint}>{options.length} điểm bán khả dụng</Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={22} color={bento.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khách hàng</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.modalClose}><MaterialCommunityIcons name="close" size={20} color={bento.text} /></Pressable>
            </View>
            <View style={styles.modalSearch}>
              <MaterialCommunityIcons name="magnify" size={19} color={bento.textMuted} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Tìm điểm bán..." placeholderTextColor={bento.textMuted} style={styles.modalSearchInput} />
            </View>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {filteredOptions.length === 0 ? <Text style={styles.muted}>Không tìm thấy điểm bán phù hợp</Text> : filteredOptions.map((option) => {
                const active = option.id === value;
                return (
                  <Pressable key={option.id} onPress={() => { onChange(option.id); setOpen(false); setQuery(""); }} style={({ pressed }) => [styles.dropdownOption, active && styles.dropdownOptionActive, pressed && styles.pressed]}>
                    <View style={[styles.optionIcon, active && styles.optionIconActive]}><MaterialCommunityIcons name="storefront-outline" size={17} color={active ? "#fff" : bento.primary} /></View>
                    <View style={styles.optionTextBlock}>
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]} numberOfLines={1}>{option.label}</Text>
                      <Text style={styles.optionSub} numberOfLines={1}>{option.address || option.note || (option.status ? statusLabel(option.status) : "Điểm bán")}</Text>
                    </View>
                    {active ? <MaterialCommunityIcons name="check-circle" size={20} color={bento.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function matchesQuery(value: string, query: string) {
  return value.toLocaleLowerCase("vi-VN").includes(query.trim().toLocaleLowerCase("vi-VN"));
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

function loadingGpsStatus(): GpsStatus {
  return { key: "loading", title: "Đang lấy GPS", message: "Đợi vài giây để thiết bị khóa vị trí chính xác hơn.", icon: "crosshairs-gps", tone: "blue", canCheckIn: false };
}

function getGpsStatus({ selectedCustomer, latitude, longitude, position, error }: { selectedCustomer?: ChoiceOption; latitude: string; longitude: string; position: CurrentPosition | null; error: string }): GpsStatus {
  if (!selectedCustomer) return { key: "select_customer", title: "Chưa chọn điểm bán", message: "Chọn khách hàng trước khi lấy GPS và check-in.", icon: "store-search-outline", tone: "muted", canCheckIn: false };
  if (error && /quyền|permission/i.test(error)) return { key: "need_permission", title: "Chưa cấp quyền vị trí", message: "Cấp quyền Location cho trình duyệt/thiết bị rồi bấm Lấy GPS lại.", icon: "map-marker-alert-outline", tone: "danger", canCheckIn: false };
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  if (lat === undefined || lng === undefined) return { key: "need_gps", title: "Chưa có GPS", message: "Bấm Lấy GPS hoặc nhập tọa độ hợp lệ để tiếp tục.", icon: "crosshairs-question", tone: "warning", canCheckIn: false };
  if (position?.accuracy && position.accuracy > WEAK_GPS_ACCURACY_METERS) return { key: "weak", title: "GPS yếu", message: `Sai số khoảng ${Math.round(position.accuracy)}m. Nên đứng ngoài trời hoặc lấy GPS lại.`, icon: "signal-cellular-outline", tone: "warning", canCheckIn: false };
  const distance = getDistanceToCustomer(selectedCustomer, latitude, longitude);
  if (typeof distance === "number" && distance > CHECK_IN_RADIUS_METERS) return { key: "out_of_range", title: "Ngoài bán kính", message: `Bạn cần ở trong bán kính ${CHECK_IN_RADIUS_METERS}m của điểm bán để check-in.`, icon: "map-marker-distance", tone: "danger", canCheckIn: false };
  if (!position) return { key: "manual", title: "Tọa độ nhập tay", message: "Có thể check-in bằng tọa độ nhập tay, nhưng nên bấm Lấy GPS để ghi sai số.", icon: "map-marker-outline", tone: "blue", canCheckIn: true };
  return { key: "ready", title: "Sẵn sàng check-in", message: "GPS hợp lệ và điểm bán đã được chọn.", icon: "check-decagram", tone: "success", canCheckIn: true };
}

function getDistanceToCustomer(customer: ChoiceOption | undefined, latitude: string, longitude: string) {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  if (!customer?.latitude || !customer.longitude || lat === undefined || lng === undefined) return undefined;
  return haversineMeters(lat, lng, customer.latitude, customer.longitude);
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function formatDistance(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

function parseCoordinate(value: string) {
  const coordinate = Number(value.trim().replace(",", "."));
  return Number.isFinite(coordinate) ? coordinate : undefined;
}

function isVisitedRouteCustomer(status?: string) {
  return status === "checked_in" || status === "visited" || status === "skipped";
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
  page: { alignSelf: "center", gap: 14, maxWidth: 430, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerAction: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 14, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  title: { color: bento.text, fontSize: 23, fontWeight: "900", marginTop: 2 },
  mapCard: { backgroundColor: "#EDF4F8", borderColor: bento.border, borderRadius: 22, borderWidth: 1, height: 318, overflow: "hidden", ...bentoShadow },
  mapGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.85 },
  mapLineV: { backgroundColor: "rgba(148,163,184,0.28)", bottom: 0, position: "absolute", top: 0, width: 1 },
  mapLineH: { backgroundColor: "rgba(148,163,184,0.28)", height: 1, left: 0, position: "absolute", right: 0 },
  gpsHaloOuter: { backgroundColor: "rgba(80,134,255,0.13)", borderColor: "rgba(80,134,255,0.18)", borderRadius: 118, borderWidth: 1, height: 236, left: "50%", marginLeft: -118, marginTop: -118, position: "absolute", top: "47%", width: 236 },
  gpsHaloInner: { backgroundColor: "rgba(80,134,255,0.18)", borderColor: "rgba(80,134,255,0.28)", borderRadius: 68, borderWidth: 1, height: 136, left: "50%", marginLeft: -68, marginTop: -68, position: "absolute", top: "47%", width: 136 },
  gpsDot: { alignItems: "center", borderColor: "#fff", borderRadius: 25, borderWidth: 5, height: 50, justifyContent: "center", left: "50%", marginLeft: -25, marginTop: -25, position: "absolute", top: "47%", width: 50, ...bentoSoftShadow },
  mapPin: { alignItems: "center", backgroundColor: "#fff", borderRadius: 16, height: 32, justifyContent: "center", position: "absolute", width: 32, ...bentoSoftShadow },
  mapPinOne: { left: 48, top: 78 },
  mapPinTwo: { right: 58, top: 122 },
  mapPinThree: { bottom: 106, left: 88 },
  mapTopPill: { alignItems: "center", backgroundColor: "#fff", borderRadius: 999, flexDirection: "row", gap: 7, left: 14, paddingHorizontal: 12, paddingVertical: 9, position: "absolute", top: 14, ...bentoSoftShadow },
  mapTopText: { color: bento.text, fontSize: 12, fontWeight: "900" },
  mapSheet: { alignItems: "center", backgroundColor: "#fff", borderRadius: 20, bottom: 14, flexDirection: "row", gap: 11, left: 14, padding: 13, position: "absolute", right: 14, ...bentoShadow },
  customerAvatar: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 17, height: 46, justifyContent: "center", width: 46 },
  sheetText: { flex: 1, minWidth: 0 },
  sheetTitle: { color: bento.text, fontSize: 15, fontWeight: "900" },
  sheetSub: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, gap: 13, padding: 15, ...bentoSoftShadow },
  sectionHeader: { alignItems: "center", flex: 1, flexDirection: "row", gap: 11 },
  sectionIcon: { alignItems: "center", borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  sectionSub: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 2 },
  dropdownGroup: { gap: 8 },
  choiceLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "900" },
  dropdownButton: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 60, paddingHorizontal: 12 },
  dropdownIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderRadius: 13, height: 38, justifyContent: "center", width: 38 },
  dropdownTextBlock: { flex: 1, minWidth: 0 },
  dropdownValue: { color: bento.text, fontSize: 14, fontWeight: "900" },
  dropdownPlaceholder: { color: bento.textMuted },
  dropdownHint: { color: bento.textSecondary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  gpsHeader: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  gpsButton: { alignItems: "center", backgroundColor: bento.text, borderRadius: 999, flexDirection: "row", gap: 6, minHeight: 40, paddingHorizontal: 12 },
  gpsButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  statusCard: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  statusIcon: { alignItems: "center", borderRadius: 14, height: 38, justifyContent: "center", width: 38 },
  statusTextBlock: { flex: 1, minWidth: 0 },
  statusTitle: { color: bento.text, fontSize: 14, fontWeight: "900" },
  statusMessage: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 2 },
  statusDistance: { color: bento.text, fontSize: 11, fontWeight: "900", marginTop: 5 },
  locationBox: { alignItems: "center", backgroundColor: bento.successSoft, borderColor: "#BBF7D0", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  locationIcon: { alignItems: "center", backgroundColor: bento.surface, borderRadius: 13, height: 34, justifyContent: "center", width: 34 },
  locationTextBlock: { flex: 1, minWidth: 0 },
  locationTitle: { color: bento.success, fontSize: 12, fontWeight: "900" },
  locationText: { color: "#166534", fontSize: 12, fontWeight: "800", lineHeight: 17, marginTop: 2 },
  coordinateRow: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 7, minWidth: 0 },
  fieldLabel: { color: bento.text, fontSize: 12, fontWeight: "900" },
  inputBox: { backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 54, paddingHorizontal: 12 },
  inputBoxMultiline: { justifyContent: "flex-start", minHeight: 96, paddingTop: 12 },
  input: { color: bento.text, fontSize: 14, fontWeight: "800", outlineStyle: "none" as never },
  textArea: { minHeight: 76, textAlignVertical: "top" },
  submitButton: { alignItems: "center", backgroundColor: bento.primary, borderRadius: 15, flexDirection: "row", gap: 9, height: 56, justifyContent: "center" },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  modalOverlay: { backgroundColor: "rgba(15,23,42,0.42)", flex: 1, justifyContent: "flex-end" },
  dropdownModal: { backgroundColor: bento.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", padding: 16 },
  modalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { color: bento.text, fontSize: 18, fontWeight: "900" },
  modalClose: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderRadius: 14, height: 38, justifyContent: "center", width: 38 },
  modalSearch: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, marginBottom: 12, minHeight: 46, paddingHorizontal: 12 },
  modalSearchInput: { color: bento.text, flex: 1, fontSize: 14, fontWeight: "700", outlineStyle: "none" as never },
  dropdownScroll: { maxHeight: 420 },
  dropdownOption: { alignItems: "center", backgroundColor: bento.surfaceAlt, borderColor: bento.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, marginBottom: 10, padding: 12 },
  dropdownOptionActive: { backgroundColor: bento.primarySoft, borderColor: bento.borderStrong },
  optionIcon: { alignItems: "center", backgroundColor: bento.primarySoft, borderRadius: 13, height: 38, justifyContent: "center", width: 38 },
  optionIconActive: { backgroundColor: bento.primary },
  optionTextBlock: { flex: 1, minWidth: 0 },
  optionTitle: { color: bento.text, fontSize: 14, fontWeight: "900" },
  optionTitleActive: { color: bento.primary },
  optionSub: { color: bento.textSecondary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  muted: { color: bento.textSecondary, fontSize: 13, fontWeight: "800", paddingVertical: 10 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
