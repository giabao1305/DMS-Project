import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { bento, bentoSoftShadow, spacing } from "../theme";
import { toVietnameseError } from "../utils/errorMessage";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type BadgeTone = "muted" | "success" | "warning" | "danger" | "info";
type MockupTone = "primary" | "blue" | "success" | "warning" | "danger" | "muted";

const mockupTones: Record<MockupTone, { color: string; bg: string; border: string }> = {
  primary: { color: bento.primaryDark, bg: bento.primarySoft, border: bento.borderStrong },
  blue: { color: bento.route, bg: bento.routeSoft, border: "#CFE0FF" },
  success: { color: bento.success, bg: bento.successSoft, border: "#BDEEDB" },
  warning: { color: bento.warning, bg: bento.warningSoft, border: "#FFE0A8" },
  danger: { color: bento.danger, bg: bento.dangerSoft, border: "#FFCACA" },
  muted: { color: bento.textSecondary, bg: bento.surfaceAlt, border: bento.border },
};

export function Card({
  children,
  style,
  compact,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  return <View style={[styles.card, compact && styles.cardCompact, style]}>{children}</View>;
}

export function AppScreen({
  children,
  style,
  compact,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  return <View style={[styles.mockScreen, compact && styles.mockScreenCompact, style]}>{children}</View>;
}

export function MockupHeader({
  title,
  eyebrow,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.mockHeader}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => [styles.mockHeaderButton, pressed && styles.buttonPressed]}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={bento.text} />
        </Pressable>
      ) : null}
      <View style={styles.mockHeaderText}>
        {eyebrow ? <Text style={styles.mockEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.mockTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.mockSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.mockHeaderAction}>{action}</View> : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon,
  tone = "primary",
  large,
  onPress,
}: {
  label: string;
  value: string | number;
  note?: string;
  icon?: IconName;
  tone?: MockupTone;
  large?: boolean;
  onPress?: () => void;
}) {
  const toneStyle = mockupTones[tone];
  const content = (
    <>
      <View style={styles.mockMetricTop}>
        {icon ? (
          <View style={[styles.mockMetricIcon, { backgroundColor: toneStyle.bg, borderColor: toneStyle.border }]}>
            <MaterialCommunityIcons name={icon} size={large ? 22 : 18} color={toneStyle.color} />
          </View>
        ) : null}
        <View style={[styles.mockMetricSignal, { backgroundColor: toneStyle.color }]} />
      </View>
      <Text style={[styles.mockMetricValue, large && styles.mockMetricValueLarge]} numberOfLines={1}>{value}</Text>
      <Text style={styles.mockMetricLabel} numberOfLines={1}>{label}</Text>
      {note ? <Text style={[styles.mockMetricNote, { color: toneStyle.color }]} numberOfLines={1}>{note}</Text> : null}
    </>
  );

  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.mockMetricCard, large && styles.mockMetricCardLarge, pressed && styles.buttonPressed]}>{content}</Pressable>;
  }

  return <View style={[styles.mockMetricCard, large && styles.mockMetricCardLarge]}>{content}</View>;
}

export function StatusPill({
  label,
  tone = "muted",
  compact,
}: {
  label: string;
  tone?: MockupTone;
  compact?: boolean;
}) {
  const toneStyle = mockupTones[tone];
  return (
    <View style={[styles.mockStatusPill, compact && styles.mockStatusPillCompact, { backgroundColor: toneStyle.bg, borderColor: toneStyle.border }]}>
      <Text style={[styles.mockStatusText, { color: toneStyle.color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function FilterTabs<T extends string>({
  items,
  value,
  onChange,
  variant = "chips",
}: {
  items: Array<{ key: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  variant?: "chips" | "segmented";
}) {
  return (
    <View style={[styles.mockFilterTabs, variant === "segmented" && styles.mockSegmentedTabs]}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              styles.mockFilterChip,
              variant === "segmented" && styles.mockSegmentedChip,
              active && styles.mockFilterChipActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.mockFilterText, active && styles.mockFilterTextActive]} numberOfLines={1}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({
  name,
  uri,
  size = 46,
  tone = "primary",
}: {
  name?: string;
  uri?: string;
  size?: number;
  tone?: MockupTone;
}) {
  const toneStyle = mockupTones[tone];
  const sizeStyle = { height: size, width: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[styles.mockAvatarImage, sizeStyle]} resizeMode="cover" />;
  return (
    <View style={[styles.mockAvatar, sizeStyle, { backgroundColor: toneStyle.bg, borderColor: toneStyle.border }]}>
      <Text style={[styles.mockAvatarText, { color: toneStyle.color, fontSize: Math.max(13, size * 0.34) }]}>{initials(name || "D")}</Text>
    </View>
  );
}

export function InfoCard({
  title,
  icon,
  tone = "primary",
  children,
  action,
}: {
  title: string;
  icon?: IconName;
  tone?: MockupTone;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const toneStyle = mockupTones[tone];
  return (
    <View style={styles.mockInfoCard}>
      <View style={styles.mockInfoHeader}>
        {icon ? (
          <View style={[styles.mockInfoIcon, { backgroundColor: toneStyle.bg, borderColor: toneStyle.border }]}>
            <MaterialCommunityIcons name={icon} size={19} color={toneStyle.color} />
          </View>
        ) : null}
        <Text style={styles.mockInfoTitle}>{title}</Text>
        {action ? <View style={styles.mockInfoAction}>{action}</View> : null}
      </View>
      <View style={styles.mockInfoBody}>{children}</View>
    </View>
  );
}

export function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | number;
  strong?: boolean;
}) {
  return (
    <View style={styles.mockInfoRow}>
      <Text style={styles.mockInfoLabel}>{label}</Text>
      <Text style={[styles.mockInfoValue, strong && styles.mockInfoValueStrong]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export function QuantityStepper({
  value,
  min = 0,
  max,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const canMinus = value > min;
  const canPlus = typeof max === "number" ? value < max : true;
  return (
    <View style={styles.mockStepper}>
      <Pressable disabled={!canMinus} onPress={() => onChange(value - 1)} style={({ pressed }) => [styles.mockStepperButton, pressed && styles.buttonPressed, !canMinus && styles.buttonDisabled]}>
        <MaterialCommunityIcons name="minus" size={16} color={bento.text} />
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(text) => {
          const parsed = Number(text.replace(/\D/g, ""));
          const next = Number.isFinite(parsed) ? parsed : min;
          onChange(Math.min(Math.max(next, min), max ?? next));
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={4}
        style={styles.mockStepperInput}
      />
      <Pressable disabled={!canPlus} onPress={() => onChange(value + 1)} style={({ pressed }) => [styles.mockStepperButton, pressed && styles.buttonPressed, !canPlus && styles.buttonDisabled]}>
        <MaterialCommunityIcons name="plus" size={16} color={bento.text} />
      </Pressable>
    </View>
  );
}

export function ProductRow({
  title,
  subtitle,
  price,
  stock,
  imageUri,
  tag,
  onPress,
  action,
}: {
  title: string;
  subtitle?: string;
  price?: string;
  stock?: string;
  imageUri?: string;
  tag?: string;
  onPress?: () => void;
  action?: React.ReactNode;
}) {
  const content = (
    <>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.mockProductImage} resizeMode="cover" /> : <View style={styles.mockProductFallback}><MaterialCommunityIcons name="package-variant-closed" size={22} color={bento.primaryDark} /></View>}
      <View style={styles.mockProductBody}>
        <View style={styles.mockProductTitleLine}>
          <Text style={styles.mockProductTitle} numberOfLines={1}>{title}</Text>
          {tag ? <StatusPill label={tag} tone="danger" compact /> : null}
        </View>
        {subtitle ? <Text style={styles.mockProductSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
        <View style={styles.mockProductMeta}>
          {price ? <Text style={styles.mockProductPrice}>{price}</Text> : null}
          {stock ? <Text style={styles.mockProductStock}>{stock}</Text> : null}
        </View>
      </View>
      {action ? <View style={styles.mockProductAction}>{action}</View> : null}
    </>
  );

  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.mockProductRow, pressed && styles.buttonPressed]}>{content}</Pressable>;
  }

  return <View style={styles.mockProductRow}>{content}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger" | "muted";
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const mutedText = variant === "ghost" || variant === "muted";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[`${variant}Button`],
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={mutedText ? bento.primary : "#fff"} />
      ) : (
        <>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={17}
              color={mutedText ? bento.primary : "#fff"}
            />
          ) : null}
          <Text style={[styles.buttonText, styles[`${variant}ButtonText`]]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={bento.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        style={[styles.input, focused && styles.inputFocused, multiline && styles.textArea]}
      />
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  action,
  icon = "view-grid-plus-outline",
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: IconName;
  onBack?: () => void;
}) {
  return (
    <View style={[styles.header, onBack && styles.headerWithBack]}>
      <View style={styles.headerMain}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            hitSlop={8}
            style={({ pressed }) => [styles.headerBack, pressed && styles.headerBackPressed]}
          >
            <MaterialCommunityIcons name="chevron-left" size={27} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name={icon} size={20} color={bento.primary} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.title, onBack && styles.titleWithBack]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, onBack && styles.subtitleWithBack]}>{subtitle}</Text> : null}
        </View>
      </View>
      {action ? <View style={styles.headerAction}>{action}</View> : null}
    </View>
  );
}

export function StatusBadge({ label, tone = "muted" }: { label: string; tone?: BadgeTone }) {
  return (
    <View style={[styles.badge, badgeStyles[tone].container]}>
      <Text style={[styles.badgeText, badgeStyles[tone].text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function MetricTile({
  label,
  value,
  note,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  note?: string;
  icon: IconName;
  tone?: "primary" | "accent" | "route" | "success";
}) {
  return (
    <Card style={styles.metric} compact>
      <View style={[styles.metricIcon, metricTones[tone]]}>
        <MaterialCommunityIcons name={icon} size={19} color="#fff" />
      </View>
      <View style={styles.metricBody}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue} numberOfLines={1}>
          {value}
        </Text>
        {note ? <Text style={styles.metricNote}>{note}</Text> : null}
      </View>
    </Card>
  );
}

export function EmptyState({
  title,
  message,
  icon = "package-variant-closed",
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={28} color={bento.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.emptyAction, pressed && styles.buttonPressed]}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FloatingActionButton({
  onPress,
  icon = "plus",
}: {
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]}>
      <MaterialCommunityIcons name={icon} size={32} color="#fff" />
    </Pressable>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  actionIcon,
  onActionPress,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  actionIcon?: IconName;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={21} color={bento.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={bento.textMuted}
          style={styles.searchInput}
        />
        {value ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8} style={({ pressed }) => [styles.searchClear, pressed && styles.buttonPressed]}>
            <MaterialCommunityIcons name="close" size={16} color={bento.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {actionIcon ? (
        <Pressable onPress={onActionPress} style={({ pressed }) => [styles.searchAction, pressed && styles.buttonPressed]}>
          <MaterialCommunityIcons name={actionIcon} size={20} color={bento.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.buttonPressed]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonLineWide} />
            <View style={styles.skeletonLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function LoadingState({ variant = "spinner" }: { variant?: "spinner" | "list" }) {
  if (variant === "list") {
    return (
      <View style={styles.loadingList}>
        <SkeletonRows count={5} />
      </View>
    );
  }

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={bento.primary} />
      <Text style={styles.loadingText}>Đang đồng bộ dữ liệu...</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.errorBanner}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={bento.danger} />
      <Text style={styles.errorText}>{toVietnameseError(message)}</Text>
    </View>
  );
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.successBanner}>
      <MaterialCommunityIcons name="check-circle-outline" size={18} color={bento.success} />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: TextStyle;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function ListScreen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.listScreen, style]}>{children}</View>;
}

export function SummaryStrip({ children }: { children: React.ReactNode }) {
  return <View style={styles.summaryStrip}>{children}</View>;
}

export function SummaryMetric({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: IconName;
  label: string;
  value: string | number;
  tone?: MockupTone;
}) {
  const color = mockupTones[tone];
  return (
    <View style={styles.summaryMetric}>
      <View style={[styles.summaryMetricIcon, { backgroundColor: color.bg, borderColor: color.border }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color.color} />
      </View>
      <Text style={styles.summaryMetricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.summaryMetricLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function ListCard({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.listCard, pressed && styles.buttonPressed, style]}>{children}</Pressable>;
  }
  return <View style={[styles.listCard, style]}>{children}</View>;
}

export function InfoGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.infoGrid}>{children}</View>;
}

export function Timeline({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.timelineList}>{children}</View>;
}

export function TimelineItem({
  children,
  color = bento.primary,
  bg = bento.primarySoft,
  index,
  icon,
  isLast,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  index?: number;
  icon?: IconName;
  isLast?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: bg, borderColor: color }]}>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={15} color={color} />
          ) : (
            <Text style={[styles.timelineIndex, { color }]}>{typeof index === "number" ? index + 1 : ""}</Text>
          )}
        </View>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineContent}>{children}</View>
    </View>
  );
}

export function MiniTimelineRow({
  title,
  meta,
  done,
  index,
}: {
  title: string;
  meta?: string;
  done?: boolean;
  index?: number;
}) {
  return (
    <View style={styles.miniTimelineRow}>
      <View style={[styles.miniTimelineDot, done && styles.miniTimelineDotDone]} />
      {typeof index === "number" ? <Text style={styles.miniTimelineIndex}>{index + 1}</Text> : null}
      <Text style={styles.miniTimelineTitle} numberOfLines={1}>{title}</Text>
      {meta ? <Text style={[styles.miniTimelineMeta, done && styles.miniTimelineMetaDone]}>{meta}</Text> : null}
    </View>
  );
}

export function StepTimeline({
  steps,
}: {
  steps: Array<{
    key: string;
    label: string;
    icon: IconName;
    state: "done" | "active" | "todo";
  }>;
}) {
  return (
    <View style={styles.stepTimeline}>
      {steps.map((step, index) => {
        const tone = step.state === "done" ? mockupTones.success : step.state === "active" ? mockupTones.primary : mockupTones.muted;
        return (
          <View key={step.key} style={styles.stepTimelineItem}>
            <View style={[styles.stepTimelineIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <MaterialCommunityIcons name={step.icon} size={17} color={tone.color} />
            </View>
            <Text style={[styles.stepTimelineText, { color: tone.color }]} numberOfLines={1}>{step.label}</Text>
            {index < steps.length - 1 ? <View style={[styles.stepTimelineLine, step.state !== "todo" && styles.stepTimelineLineActive]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const badgeStyles: Record<BadgeTone, { container: ViewStyle; text: TextStyle }> = {
  muted: {
    container: { backgroundColor: bento.surfaceAlt, borderColor: bento.border },
    text: { color: bento.textSecondary },
  },
  success: {
    container: { backgroundColor: bento.successSoft, borderColor: "#BBF7D0" },
    text: { color: bento.success },
  },
  warning: {
    container: { backgroundColor: bento.warningSoft, borderColor: "#FDE68A" },
    text: { color: bento.warning },
  },
  danger: {
    container: { backgroundColor: bento.dangerSoft, borderColor: "#FECACA" },
    text: { color: bento.danger },
  },
  info: {
    container: { backgroundColor: bento.primarySoft, borderColor: bento.borderStrong },
    text: { color: bento.primary },
  },
};

const metricTones = {
  primary: { backgroundColor: bento.primary },
  accent: { backgroundColor: bento.info },
  route: { backgroundColor: bento.route },
  success: { backgroundColor: bento.success },
};

export function toneForStatus(status?: string): BadgeTone {
  if (status === "approved" || status === "delivered" || status === "completed" || status === "checked_out") {
    return "success";
  }
  if (status === "pending" || status === "planned" || status === "in_progress" || status === "checked_in") {
    return "warning";
  }
  if (status === "rejected" || status === "cancelled" || status === "returned") return "danger";
  if (status === "return_requested") return "info";
  return "muted";
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "D";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] || ""}`.toUpperCase();
}

const styles = StyleSheet.create({
  listScreen: {
    alignSelf: "center",
    gap: 16,
    maxWidth: 430,
    paddingHorizontal: 20,
    paddingTop: 18,
    width: "100%",
  },
  summaryStrip: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 10,
  },
  summaryMetric: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 15,
    borderWidth: 1,
    flexBasis: "22%",
    flexGrow: 1,
    minWidth: 86,
    padding: 10,
  },
  summaryMetricIcon: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  summaryMetricValue: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },
  summaryMetricLabel: {
    color: bento.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  listCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 13,
    padding: 14,
    ...bentoSoftShadow,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 10,
  },
  timelineRail: {
    alignItems: "center",
    width: 28,
  },
  timelineDot: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  timelineIndex: {
    fontSize: 10,
    fontWeight: "900",
  },
  timelineLine: {
    backgroundColor: bento.border,
    flex: 1,
    minHeight: 80,
    width: 2,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
  },
  miniTimelineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  miniTimelineDot: {
    backgroundColor: bento.border,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  miniTimelineDotDone: {
    backgroundColor: bento.success,
  },
  miniTimelineIndex: {
    color: bento.textMuted,
    fontSize: 11,
    fontWeight: "900",
    width: 20,
  },
  miniTimelineTitle: {
    color: bento.text,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  miniTimelineMeta: {
    color: bento.warning,
    fontSize: 10,
    fontWeight: "900",
  },
  miniTimelineMetaDone: {
    color: bento.success,
  },
  stepTimeline: {
    flexDirection: "row",
    gap: 3,
  },
  stepTimelineItem: {
    alignItems: "center",
    flex: 1,
    gap: 7,
    position: "relative",
  },
  stepTimelineIcon: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
    zIndex: 2,
  },
  stepTimelineText: {
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  stepTimelineLine: {
    backgroundColor: bento.border,
    height: 2,
    left: "58%",
    position: "absolute",
    right: "-42%",
    top: 17,
  },
  stepTimelineLineActive: {
    backgroundColor: bento.primary,
  },
  mockScreen: {
    alignSelf: "center",
    gap: 18,
    maxWidth: 430,
    paddingHorizontal: 22,
    paddingTop: 18,
    width: "100%",
  },
  mockScreenCompact: {
    gap: 14,
    paddingHorizontal: 18,
  },
  mockHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 50,
  },
  mockHeaderButton: {
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
  mockHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  mockHeaderAction: {
    alignItems: "flex-end",
  },
  mockEyebrow: {
    color: bento.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  mockTitle: {
    color: bento.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0,
  },
  mockSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  mockMetricCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    minHeight: 112,
    minWidth: 0,
    padding: 14,
    ...bentoSoftShadow,
  },
  mockMetricCardLarge: {
    minHeight: 140,
    padding: 16,
  },
  mockMetricTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mockMetricIcon: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  mockMetricSignal: {
    borderRadius: 999,
    height: 5,
    opacity: 0.85,
    width: 28,
  },
  mockMetricValue: {
    color: bento.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 12,
  },
  mockMetricValueLarge: {
    fontSize: 30,
  },
  mockMetricLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  mockMetricNote: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  mockStatusPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 150,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mockStatusPillCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  mockStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  mockFilterTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mockSegmentedTabs: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 16,
    borderWidth: 1,
    flexWrap: "nowrap",
    gap: 4,
    padding: 4,
  },
  mockFilterChip: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 14,
  },
  mockSegmentedChip: {
    borderColor: "transparent",
    borderRadius: 12,
    borderWidth: 0,
    flex: 1,
    paddingHorizontal: 8,
  },
  mockFilterChipActive: {
    backgroundColor: bento.primary,
    borderColor: bento.primary,
  },
  mockFilterText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  mockFilterTextActive: {
    color: "#fff",
  },
  mockAvatar: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  mockAvatarImage: {
    backgroundColor: bento.surfaceAlt,
  },
  mockAvatarText: {
    fontWeight: "800",
  },
  mockInfoCard: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...bentoSoftShadow,
  },
  mockInfoHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  mockInfoIcon: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  mockInfoTitle: {
    color: bento.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  mockInfoAction: {
    alignItems: "flex-end",
  },
  mockInfoBody: {
    gap: 10,
  },
  mockInfoRow: {
    alignItems: "flex-start",
    borderTopColor: bento.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  mockInfoLabel: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  mockInfoValue: {
    color: bento.text,
    flex: 1.3,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  mockInfoValueStrong: {
    color: bento.primaryDark,
    fontSize: 15,
  },
  mockStepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  mockStepperButton: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 11,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  mockStepperInput: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 11,
    borderWidth: 1,
    color: bento.text,
    fontSize: 14,
    fontWeight: "800",
    height: 34,
    minWidth: 44,
    paddingHorizontal: 7,
    paddingVertical: 0,
    textAlign: "center",
  },
  mockProductRow: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 82,
    padding: 12,
    ...bentoSoftShadow,
  },
  mockProductImage: {
    borderRadius: 15,
    height: 56,
    width: 56,
  },
  mockProductFallback: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 15,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  mockProductBody: {
    flex: 1,
    minWidth: 0,
  },
  mockProductTitleLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  mockProductTitle: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  mockProductSubtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  mockProductMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },
  mockProductPrice: {
    color: bento.text,
    fontSize: 13,
    fontWeight: "800",
  },
  mockProductStock: {
    color: bento.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  mockProductAction: {
    alignItems: "center",
  },
  card: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    ...bentoSoftShadow,
  },
  cardCompact: {
    padding: spacing.md,
  },
  button: {
    alignItems: "center",
    borderRadius: 13,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...bentoSoftShadow,
  },
  primaryButton: {
    backgroundColor: bento.primary,
  },
  dangerButton: {
    backgroundColor: bento.danger,
  },
  ghostButton: {
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderWidth: 1,
  },
  mutedButton: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
  },
  primaryButtonText: { color: "#fff" },
  dangerButtonText: { color: "#fff" },
  ghostButtonText: { color: bento.text },
  mutedButtonText: { color: bento.primary },
  field: {
    gap: 7,
  },
  label: {
    color: bento.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
  },
  input: {
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 13,
    borderWidth: 1,
    color: bento.text,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...bentoSoftShadow,
  },
  inputFocused: {
    borderColor: bento.primary,
    backgroundColor: "#fff",
    shadowOpacity: 0.12,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerWithBack: {
    backgroundColor: bento.chrome,
    flexWrap: "nowrap",
    marginBottom: 0,
    minHeight: 74,
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },
  headerMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 190,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 13,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerBack: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerBackPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
    opacity: 0.82,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerAction: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  title: {
    color: bento.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 24,
  },
  titleWithBack: {
    color: "#fff",
    fontSize: 19,
    textAlign: "center",
  },
  subtitle: {
    color: bento.textSecondary,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 1,
  },
  subtitleWithBack: {
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 150,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
  },
  metric: {
    alignItems: "flex-start",
    flexBasis: 128,
    flexGrow: 1,
    gap: 7,
    minWidth: 72,
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  metricBody: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
  },
  metricValue: {
    color: bento.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 1,
  },
  metricNote: {
    color: bento.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  empty: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 28,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  emptyTitle: {
    color: bento.text,
    fontSize: 17,
    fontWeight: "900",
  },
  emptyMessage: {
    color: bento.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  emptyAction: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  loading: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 180,
    padding: spacing.xl,
  },
  loadingText: {
    color: bento.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingList: {
    padding: spacing.lg,
  },
  fab: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 31,
    bottom: 86,
    height: 58,
    justifyContent: "center",
    position: "absolute",
    right: 22,
    width: 58,
    ...bentoSoftShadow,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    ...bentoSoftShadow,
  },
  searchInput: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    outlineStyle: "none" as never,
  },
  searchAction: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 14,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
    ...bentoSoftShadow,
  },
  searchClear: {
    alignItems: "center",
    backgroundColor: bento.surfaceAlt,
    borderColor: bento.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  filterChipActive: {
    backgroundColor: bento.primary,
    borderColor: bento.primary,
  },
  filterChipText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  skeletonList: {
    gap: spacing.md,
  },
  skeletonRow: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 78,
    padding: spacing.md,
  },
  skeletonAvatar: {
    backgroundColor: bento.primarySoft,
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  skeletonBody: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLineWide: {
    backgroundColor: bento.surfaceAlt,
    borderRadius: 999,
    height: 12,
    width: "72%",
  },
  skeletonLine: {
    backgroundColor: bento.border,
    borderRadius: 999,
    height: 10,
    width: "48%",
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: bento.dangerSoft,
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    color: bento.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  successBanner: {
    alignItems: "center",
    backgroundColor: bento.successSoft,
    borderColor: "#BBF7D0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  successText: {
    color: bento.success,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  row: {
    alignItems: "flex-start",
    borderTopColor: bento.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  rowLabel: {
    color: bento.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  rowValue: {
    color: bento.text,
    flex: 1.35,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
});
