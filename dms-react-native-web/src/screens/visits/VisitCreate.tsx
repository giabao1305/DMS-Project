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
} from "react-native";

import { sellerApi } from "../../api/sellerApi";
import { ErrorBanner } from "../../components/Ui";
import { bento, bentoSoftShadow } from "../../theme";
import type { Customer, RoutePlan } from "../../types/domain";
import { toVietnameseError } from "../../utils/errorMessage";
import {
  getCustomerId,
  getCustomerName,
  statusLabel,
} from "../../utils/format";
import { getCurrentPosition, type CurrentPosition } from "./visitLocation";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type ToneName =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "blue"
  | "routeAlt"
  | "muted";
type VisitMode = "route" | "out_of_route";
type ChoiceOption = {
  id: string;
  label: string;
  status?: string;
  note?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};
type GpsStatus = {
  key: string;
  title: string;
  message: string;
  icon: IconName;
  tone: ToneName;
  canCheckIn: boolean;
};

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
  const [visitMode, setVisitMode] = useState<VisitMode>(
    initialRouteId ? "route" : "out_of_route",
  );
  const [customerId, setCustomerId] = useState(initialCustomerId || "");
  const [routeId, setRouteId] = useState(initialRouteId || "");
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<CurrentPosition | null>(null);

  const selectedRoute = useMemo(
    () =>
      visitMode === "route"
        ? routes.find((route) => route._id === routeId)
        : undefined,
    [routeId, routes, visitMode],
  );
  const routedCustomerIds = useMemo(
    () =>
      new Set(
        routes.flatMap((route) =>
          route.customers
            .map((item) => getCustomerId(item.customer))
            .filter(Boolean),
        ),
      ),
    [routes],
  );
  const routeOptions = useMemo<ChoiceOption[]>(() => {
    if (!selectedRoute) return [];
    return sortRouteCustomers(selectedRoute.customers)
      .map((item) => {
        const id = getCustomerId(item.customer);
        const fallback = customers.find((customer) => customer._id === id);
        const customer =
          typeof item.customer === "string"
            ? fallback
            : item.customer || fallback;
        return {
          id,
          label: getCustomerName(customer || item.customer),
          status: item.status,
          note:
            item.note || (item.orderIndex ? `#${item.orderIndex}` : undefined),
          address: typeof customer === "string" ? "" : customer?.address,
          latitude:
            typeof customer === "string" ? undefined : customer?.latitude,
          longitude:
            typeof customer === "string" ? undefined : customer?.longitude,
        };
      })
      .filter((item) =>
        Boolean(item.id && !isVisitedRouteCustomer(item.status)),
      ) as ChoiceOption[];
  }, [customers, selectedRoute]);

  const customerOptions = useMemo<ChoiceOption[]>(() => {
    if (visitMode === "route") return routeOptions;
    return customers
      .filter(
        (customer) =>
          customer.status === "approved" &&
          customer.isActive &&
          !routedCustomerIds.has(customer._id),
      )
      .map((customer) => ({
        id: customer._id,
        label: getCustomerName(customer),
        address: customer.address,
        status: customer.status,
        latitude: customer.latitude,
        longitude: customer.longitude,
      }));
  }, [customers, routeOptions, routedCustomerIds, visitMode]);

  const selectedCustomer = customerOptions.find(
    (item) => item.id === customerId,
  );
  const gpsStatus = gettingLocation
    ? loadingGpsStatus()
    : getGpsStatus({ selectedCustomer, latitude, longitude, position, error });
  const distanceToCustomer = getDistanceToCustomer(
    selectedCustomer,
    latitude,
    longitude,
  );
  const routeReady =
    visitMode === "out_of_route" || selectedRoute?.status === "in_progress";
  const canSubmit = Boolean(
    customerId &&
    latitude &&
    longitude &&
    gpsStatus.canCheckIn &&
    routeReady &&
    !submitting &&
    (visitMode === "out_of_route" || selectedRoute),
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

  const checkIn = async () => {
    const checkInLatitude = parseCoordinate(latitude);
    const checkInLongitude = parseCoordinate(longitude);
    if (checkInLatitude === undefined || checkInLongitude === undefined) {
      setError("Vui lòng lấy hoặc nhập tọa độ GPS hợp lệ trước khi check-in.");
      return;
    }
    if (
      checkInLatitude < -90 ||
      checkInLatitude > 90 ||
      checkInLongitude < -180 ||
      checkInLongitude > 180
    ) {
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
      await sellerApi.checkIn({
        customer: customerId,
        route: visitMode === "route" ? routeId || undefined : undefined,
        checkInLatitude,
        checkInLongitude,
        gpsAccuracy: position?.accuracy,
        note: note.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Không check-in được",
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
            <Text style={styles.eyebrow}>Ghé thăm</Text>
            <Text style={styles.title}>Bắt đầu ghé thăm</Text>
          </View>
          <Pressable
            onPress={fillCurrentLocation}
            disabled={gettingLocation}
            style={({ pressed }) => [
              styles.headerAction,
              pressed && styles.pressed,
              gettingLocation && styles.disabled,
            ]}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={20}
              color="#fff"
            />
          </Pressable>
        </View>

        <ErrorBanner message={error} />

        <View style={styles.card}>
          <SectionHeader
            icon="map-marker-path"
            title="Tuyến & điểm bán"
            subtitle="Chọn điểm bán trong tuyến hoặc check-in ngoài tuyến."
            tone="primary"
          />
          <VisitModeSelector
            value={visitMode}
            onChange={(value) => {
              setVisitMode(value);
              setRouteId(value === "route" ? routeId : "");
              setCustomerId("");
            }}
          />
          {visitMode === "route" ? (
            <RouteSelector
              value={routeId}
              routes={routes}
              onChange={(value) => {
                setRouteId(value);
                setCustomerId("");
              }}
            />
          ) : null}
          <CustomerDropdown
            label={
              visitMode === "route"
                ? "Điểm bán trong tuyến"
                : "Điểm bán ngoài tuyến"
            }
            value={customerId}
            options={customerOptions}
            onChange={setCustomerId}
          />
          {selectedCustomer ? (
            <View style={styles.selectedStop}>
              <View style={styles.selectedStopIcon}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={18}
                  color="#6D28D9"
                />
              </View>
              <View style={styles.selectedStopBody}>
                <Text style={styles.selectedStopName} numberOfLines={1}>
                  {selectedCustomer.label}
                </Text>
                <Text style={styles.selectedStopMeta} numberOfLines={1}>
                  {selectedCustomer.address ||
                    selectedRoute?.name ||
                    "Ngoài tuyến"}
                </Text>
              </View>
            </View>
          ) : null}
          {selectedRoute && !routeReady ? (
            <View style={styles.routeWarning}>
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={18}
                color={bento.warning}
              />
              <Text style={styles.routeWarningText}>
                Tuyến cần được bắt đầu trước khi check-in.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.gpsHeader}>
            <SectionHeader
              icon="crosshairs-gps"
              title="Vị trí GPS"
              subtitle="Lấy vị trí hiện tại để ghi nhận check-in."
              tone="routeAlt"
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
                name="crosshairs-gps"
                size={16}
                color="#fff"
              />
              <Text style={styles.gpsButtonText}>
                {gettingLocation ? "Đang lấy" : "Lấy GPS"}
              </Text>
            </Pressable>
          </View>
          <GpsStatusCard status={gpsStatus} distance={distanceToCustomer} />
          {position ? (
            <View style={styles.locationBox}>
              <View style={styles.locationIcon}>
                <MaterialCommunityIcons
                  name="map-marker-check-outline"
                  size={18}
                  color={bento.success}
                />
              </View>
              <View style={styles.locationTextBlock}>
                <Text style={styles.locationTitle}>GPS hiện tại</Text>
                <Text style={styles.locationText}>
                  {position.latitude.toFixed(6)},{" "}
                  {position.longitude.toFixed(6)}
                  {position.accuracy
                    ? ` - sai số ${Math.round(position.accuracy)}m`
                    : ""}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={styles.coordinateRow}>
            <MobileField
              label="Vĩ độ"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              placeholder="10.762622"
            />
            <MobileField
              label="Kinh độ"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              placeholder="106.660172"
            />
          </View>
          <MobileField
            label="Ghi chú"
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Tồn kho, trưng bày, nhu cầu đặt hàng..."
          />
          <Pressable
            onPress={checkIn}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
              !canSubmit && styles.disabled,
            ]}
          >
            <MaterialCommunityIcons
              name="map-marker-check"
              size={20}
              color="#fff"
            />
            <Text style={styles.submitText}>
              {submitting ? "Đang check-in..." : "Check-in ngay"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  tone,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
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
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function GpsStatusCard({
  status,
  distance,
}: {
  status: GpsStatus;
  distance?: number;
}) {
  const color = toneColors(status.tone);
  return (
    <View
      style={[
        styles.statusCard,
        { backgroundColor: bento.surface, borderColor: color.border },
      ]}
    >
      <View style={[styles.statusIcon, { backgroundColor: color.text }]}>
        <MaterialCommunityIcons name={status.icon} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.statusTextBlock}>
        <Text style={styles.statusTitle}>{status.title}</Text>
        <Text style={styles.statusMessage}>{status.message}</Text>
        {typeof distance === "number" ? (
          <Text style={styles.statusDistance}>
            Cách điểm bán khoảng {formatDistance(distance)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function VisitModeSelector({
  value,
  onChange,
}: {
  value: VisitMode;
  onChange: (value: VisitMode) => void;
}) {
  const modes: Array<{ key: VisitMode; label: string; icon: IconName }> = [
    { key: "route", label: "Trong tuyến", icon: "map-marker-path" },
    {
      key: "out_of_route",
      label: "Ngoài tuyến",
      icon: "map-marker-off-outline",
    },
  ];

  return (
    <View style={styles.modeRow}>
      {modes.map((mode) => {
        const active = value === mode.key;
        return (
          <Pressable
            key={mode.key}
            onPress={() => onChange(mode.key)}
            style={({ pressed }) => [
              styles.modeChip,
              active && styles.modeChipActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={mode.icon}
              size={16}
              color={active ? bento.primaryDark : bento.textSecondary}
            />
            <Text style={[styles.modeText, active && styles.modeTextActive]}>
              {mode.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RouteSelector({
  value,
  routes,
  onChange,
}: {
  value: string;
  routes: RoutePlan[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = routes.find((route) => route._id === value);
  const filteredRoutes = routes.filter(
    (route) =>
      route.status === "in_progress" &&
      matchesQuery(`${route.name} ${statusLabel(route.status)}`, query),
  );

  return (
    <View style={styles.dropdownGroup}>
      <Text style={styles.choiceLabel}>Tuyến ghé</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdownButton,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.dropdownIcon}>
          <MaterialCommunityIcons
            name="map-marker-path"
            size={18}
            color={bento.primary}
          />
        </View>
        <View style={styles.dropdownTextBlock}>
          <Text style={styles.dropdownValue} numberOfLines={1}>
            {selected?.name || "Ngoài tuyến"}
          </Text>
          <Text style={styles.dropdownHint}>
            {selected
              ? statusLabel(selected.status)
              : "Check-in không theo tuyến"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={bento.textSecondary}
        />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tuyến ghé</Text>
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.modalClose}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={bento.text}
                />
              </Pressable>
            </View>
            <View style={styles.modalSearch}>
              <MaterialCommunityIcons
                name="magnify"
                size={19}
                color={bento.textMuted}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm tên tuyến..."
                placeholderTextColor={bento.textMuted}
                style={styles.modalSearchInput}
              />
            </View>
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
            >
              {filteredRoutes.length === 0 ? (
                <Text style={styles.muted}>Không tìm thấy tuyến phù hợp</Text>
              ) : (
                filteredRoutes.map((route) => {
                  const active = route._id === value;
                  return (
                    <Pressable
                      key={route._id}
                      onPress={() => {
                        onChange(route._id);
                        setOpen(false);
                        setQuery("");
                      }}
                      style={({ pressed }) => [
                        styles.dropdownOption,
                        active && styles.dropdownOptionActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          active && styles.optionIconActive,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-path"
                          size={17}
                          color={active ? "#fff" : bento.primary}
                        />
                      </View>
                      <View style={styles.optionTextBlock}>
                        <Text
                          style={[
                            styles.optionTitle,
                            active && styles.optionTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {route.name}
                        </Text>
                        <Text style={styles.optionSub}>
                          {statusLabel(route.status)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CustomerDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((item) => item.id === value);
  const filteredOptions = options.filter((option) =>
    matchesQuery(
      `${option.label} ${option.address || ""} ${option.note || ""}`,
      query,
    ),
  );
  return (
    <View style={styles.dropdownGroup}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.dropdownButton,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.dropdownIcon}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={18}
            color={bento.primary}
          />
        </View>
        <View style={styles.dropdownTextBlock}>
          <Text
            style={[
              styles.dropdownValue,
              !selected && styles.dropdownPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selected ? selected.label : "Chọn khách hàng"}
          </Text>
          <Text style={styles.dropdownHint}>
            {options.length} điểm bán khả dụng
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={bento.textSecondary}
        />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.dropdownModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khách hàng</Text>
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.modalClose}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={bento.text}
                />
              </Pressable>
            </View>
            <View style={styles.modalSearch}>
              <MaterialCommunityIcons
                name="magnify"
                size={19}
                color={bento.textMuted}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm điểm bán..."
                placeholderTextColor={bento.textMuted}
                style={styles.modalSearchInput}
              />
            </View>
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
            >
              {filteredOptions.length === 0 ? (
                <Text style={styles.muted}>
                  Không tìm thấy điểm bán phù hợp
                </Text>
              ) : (
                filteredOptions.map((option) => {
                  const active = option.id === value;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        onChange(option.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      style={({ pressed }) => [
                        styles.dropdownOption,
                        active && styles.dropdownOptionActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          active && styles.optionIconActive,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="storefront-outline"
                          size={17}
                          color={active ? "#fff" : bento.primary}
                        />
                      </View>
                      <View style={styles.optionTextBlock}>
                        <Text
                          style={[
                            styles.optionTitle,
                            active && styles.optionTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {option.label}
                        </Text>
                        <Text style={styles.optionSub} numberOfLines={1}>
                          {option.address ||
                            option.note ||
                            (option.status
                              ? statusLabel(option.status)
                              : "Điểm bán")}
                        </Text>
                      </View>
                      {active ? (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={bento.primary}
                        />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function matchesQuery(value: string, query: string) {
  return value
    .toLocaleLowerCase("vi-VN")
    .includes(query.trim().toLocaleLowerCase("vi-VN"));
}

function sortRouteCustomers(customers: RoutePlan["customers"]) {
  return [...customers].sort(
    (left, right) =>
      getRouteOrder(left.orderIndex) - getRouteOrder(right.orderIndex),
  );
}

function getRouteOrder(value?: number) {
  return Number.isFinite(value) && value ? value : Number.MAX_SAFE_INTEGER;
}

function MobileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, multiline && styles.inputBoxMultiline]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={bento.textMuted}
          style={[styles.input, multiline && styles.textArea]}
        />
      </View>
    </View>
  );
}

function loadingGpsStatus(): GpsStatus {
  return {
    key: "loading",
    title: "Đang lấy GPS",
    message: "Đợi vài giây để thiết bị khóa vị trí chính xác hơn.",
    icon: "crosshairs-gps",
    tone: "blue",
    canCheckIn: false,
  };
}

function getGpsStatus({
  selectedCustomer,
  latitude,
  longitude,
  position,
  error,
}: {
  selectedCustomer?: ChoiceOption;
  latitude: string;
  longitude: string;
  position: CurrentPosition | null;
  error: string;
}): GpsStatus {
  if (!selectedCustomer)
    return {
      key: "select_customer",
      title: "Chưa chọn điểm bán",
      message: "Chọn khách hàng trước khi lấy GPS và check-in.",
      icon: "store-search-outline",
      tone: "muted",
      canCheckIn: false,
    };
  if (error && /quyền|permission/i.test(error))
    return {
      key: "need_permission",
      title: "Chưa cấp quyền vị trí",
      message:
        "Cấp quyền Location cho trình duyệt/thiết bị rồi bấm Lấy GPS lại.",
      icon: "map-marker-alert-outline",
      tone: "danger",
      canCheckIn: false,
    };
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  if (lat === undefined || lng === undefined)
    return {
      key: "need_gps",
      title: "Chưa có GPS",
      message: "Bấm Lấy GPS hoặc nhập tọa độ hợp lệ để tiếp tục.",
      icon: "crosshairs-question",
      tone: "warning",
      canCheckIn: false,
    };
  if (position?.accuracy && position.accuracy > WEAK_GPS_ACCURACY_METERS)
    return {
      key: "weak",
      title: "GPS yếu",
      message: `Sai số khoảng ${Math.round(position.accuracy)}m. Nên đứng ngoài trời hoặc lấy GPS lại.`,
      icon: "signal-cellular-outline",
      tone: "warning",
      canCheckIn: false,
    };
  const distance = getDistanceToCustomer(selectedCustomer, latitude, longitude);
  if (typeof distance === "number" && distance > CHECK_IN_RADIUS_METERS)
    return {
      key: "out_of_range",
      title: "Ngoài bán kính",
      message: `Bạn cần ở trong bán kính ${CHECK_IN_RADIUS_METERS}m của điểm bán để check-in.`,
      icon: "map-marker-distance",
      tone: "danger",
      canCheckIn: false,
    };
  if (!position)
    return {
      key: "manual",
      title: "Tọa độ nhập tay",
      message:
        "Có thể check-in bằng tọa độ nhập tay, nhưng nên bấm Lấy GPS để ghi sai số.",
      icon: "map-marker-outline",
      tone: "blue",
      canCheckIn: true,
    };
  return {
    key: "ready",
    title: "Sẵn sàng check-in",
    message: "GPS hợp lệ và điểm bán đã được chọn.",
    icon: "check-decagram",
    tone: "success",
    canCheckIn: true,
  };
}

function getDistanceToCustomer(
  customer: ChoiceOption | undefined,
  latitude: string,
  longitude: string,
) {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  if (
    !customer?.latitude ||
    !customer.longitude ||
    lat === undefined ||
    lng === undefined
  )
    return undefined;
  return haversineMeters(lat, lng, customer.latitude, customer.longitude);
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
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
  return (
    status === "checked_in" || status === "visited" || status === "skipped"
  );
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
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 430,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 13,
    padding: 15,
    ...bentoSoftShadow,
  },
  sectionHeader: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 11,
  },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "700" },
  sectionSub: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  modeRow: { flexDirection: "row", gap: 8 },
  modeChip: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 10,
  },
  modeChipActive: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  modeText: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  modeTextActive: { color: bento.primaryDark },
  dropdownGroup: { gap: 8 },
  choiceLabel: { color: bento.textSecondary, fontSize: 12, fontWeight: "700" },
  dropdownButton: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 60,
    paddingHorizontal: 12,
  },
  dropdownIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  dropdownTextBlock: { flex: 1, minWidth: 0 },
  dropdownValue: { color: bento.text, fontSize: 14, fontWeight: "700" },
  dropdownPlaceholder: { color: bento.textMuted },
  dropdownHint: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  gpsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  selectedStop: {
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },
  selectedStopIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  selectedStopBody: { flex: 1, minWidth: 0 },
  selectedStopName: { color: bento.text, fontSize: 13, fontWeight: "700" },
  selectedStopMeta: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  routeWarning: {
    alignItems: "center",
    backgroundColor: bento.warningSoft,
    borderColor: "#FFE0A8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 11,
  },
  routeWarningText: {
    color: bento.warning,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  gpsButton: {
    alignItems: "center",
    backgroundColor: bento.route,
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  gpsButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  statusCard: {
    alignItems: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  statusIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  statusTextBlock: { flex: 1, minWidth: 0 },
  statusTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  statusMessage: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  statusDistance: {
    color: bento.text,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },
  locationBox: {
    alignItems: "center",
    backgroundColor: bento.successSoft,
    borderColor: bento.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  locationIcon: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  locationTextBlock: { flex: 1, minWidth: 0 },
  locationTitle: { color: bento.success, fontSize: 12, fontWeight: "700" },
  locationText: {
    color: bento.route,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 2,
  },
  coordinateRow: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 7, minWidth: 0 },
  fieldLabel: { color: bento.text, fontSize: 12, fontWeight: "700" },
  inputBox: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 12,
  },
  inputBoxMultiline: {
    justifyContent: "flex-start",
    minHeight: 96,
    paddingTop: 12,
  },
  input: {
    color: bento.text,
    fontSize: 14,
    fontWeight: "600",
    outlineStyle: "none" as never,
  },
  textArea: { minHeight: 76, textAlignVertical: "top" },
  submitButton: {
    alignItems: "center",
    backgroundColor: bento.route,
    borderRadius: 8,
    flexDirection: "row",
    gap: 9,
    height: 56,
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: bento.overlay,
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  dropdownModal: {
    alignSelf: "center",
    backgroundColor: bento.surface,
    borderRadius: 8,
    maxHeight: "78%",
    maxWidth: 520,
    padding: 16,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { color: bento.text, fontSize: 18, fontWeight: "700" },
  modalClose: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  modalSearch: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  modalSearchInput: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    outlineStyle: "none" as never,
  },
  dropdownScroll: { maxHeight: 420 },
  dropdownOption: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    marginBottom: 10,
    padding: 12,
  },
  dropdownOptionActive: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  optionIconActive: { backgroundColor: bento.primary },
  optionTextBlock: { flex: 1, minWidth: 0 },
  optionTitle: { color: bento.text, fontSize: 14, fontWeight: "700" },
  optionTitleActive: { color: bento.primary },
  optionSub: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  muted: {
    color: bento.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 10,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
