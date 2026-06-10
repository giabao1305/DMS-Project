import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  Button as PaperButton,
  TextInput as PaperTextInput,
} from "react-native-paper";

import { atlas, atlasSoftShadow, spacing, radius } from "../theme";
import { toVietnameseError } from "../utils/errorMessage";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type BadgeTone = "muted" | "success" | "warning" | "danger" | "info";
type MockupTone =
  | "primary"
  | "blue"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const mockupTones: Record<
  MockupTone,
  { color: string; bg: string; border: string }
> = {
  primary: {
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  blue: { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  success: {
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  warning: {
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  danger: {
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  muted: {
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#CBD5E1",
  },
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
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      {children}
    </View>
  );
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
  return (
    <View
      style={[styles.mockScreen, compact && styles.mockScreenCompact, style]}
    >
      {children}
    </View>
  );
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
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.mockHeaderButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>
      ) : null}
      <View style={styles.mockHeaderText}>
        {eyebrow ? <Text style={styles.mockEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.mockTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.mockSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
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
          <View
            style={[
              styles.mockMetricIcon,
              { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={large ? 22 : 18}
              color={toneStyle.color}
            />
          </View>
        ) : null}
        <View
          style={[
            styles.mockMetricSignal,
            { backgroundColor: toneStyle.color },
          ]}
        />
      </View>
      <Text
        style={[styles.mockMetricValue, large && styles.mockMetricValueLarge]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={styles.mockMetricLabel} numberOfLines={1}>
        {label}
      </Text>
      {note ? (
        <Text
          style={[styles.mockMetricNote, { color: toneStyle.color }]}
          numberOfLines={1}
        >
          {note}
        </Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.mockMetricCard,
          large && styles.mockMetricCardLarge,
          pressed && styles.buttonPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.mockMetricCard, large && styles.mockMetricCardLarge]}>
      {content}
    </View>
  );
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
    <View
      style={[
        styles.mockStatusPill,
        compact && styles.mockStatusPillCompact,
        { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
      ]}
    >
      <Text
        style={[styles.mockStatusText, { color: toneStyle.color }]}
        numberOfLines={1}
      >
        {label}
      </Text>
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
    <View
      style={[
        styles.mockFilterTabs,
        variant === "segmented" && styles.mockSegmentedTabs,
      ]}
    >
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
            <Text
              style={[
                styles.mockFilterText,
                active && styles.mockFilterTextActive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
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
  if (uri)
    return (
      <Image
        source={{ uri }}
        style={[styles.mockAvatarImage, sizeStyle]}
        resizeMode="cover"
      />
    );
  return (
    <View
      style={[
        styles.mockAvatar,
        sizeStyle,
        { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
      ]}
    >
      <Text
        style={[
          styles.mockAvatarText,
          { color: toneStyle.color, fontSize: Math.max(13, size * 0.34) },
        ]}
      >
        {initials(name || "D")}
      </Text>
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
          <View
            style={[
              styles.mockInfoIcon,
              { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={19}
              color={toneStyle.color}
            />
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
      <Text
        style={[styles.mockInfoValue, strong && styles.mockInfoValueStrong]}
        numberOfLines={2}
      >
        {value}
      </Text>
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
      <Pressable
        disabled={!canMinus}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [
          styles.mockStepperButton,
          pressed && styles.buttonPressed,
          !canMinus && styles.buttonDisabled,
        ]}
      >
        <MaterialCommunityIcons name="minus" size={16} color={atlas.text} />
      </Pressable>
      <NativeTextInput
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
      <Pressable
        disabled={!canPlus}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [
          styles.mockStepperButton,
          pressed && styles.buttonPressed,
          !canPlus && styles.buttonDisabled,
        ]}
      >
        <MaterialCommunityIcons name="plus" size={16} color={atlas.text} />
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
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.mockProductImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.mockProductFallback}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={22}
            color={atlas.primaryDark}
          />
        </View>
      )}
      <View style={styles.mockProductBody}>
        <View style={styles.mockProductTitleLine}>
          <Text style={styles.mockProductTitle} numberOfLines={1}>
            {title}
          </Text>
          {tag ? <StatusPill label={tag} tone="danger" compact /> : null}
        </View>
        {subtitle ? (
          <Text style={styles.mockProductSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.mockProductMeta}>
          {price ? <Text style={styles.mockProductPrice}>{price}</Text> : null}
          {stock ? <Text style={styles.mockProductStock}>{stock}</Text> : null}
        </View>
      </View>
      {action ? <View style={styles.mockProductAction}>{action}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.mockProductRow,
          pressed && styles.buttonPressed,
        ]}
      >
        {content}
      </Pressable>
    );
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
  const mode =
    variant === "primary" || variant === "danger" ? "contained" : "outlined";
  const buttonStyle = [
    styles.paperButton,
    styles[`${variant}Button`],
    (disabled || loading) && styles.buttonDisabled,
    style,
  ];

  return (
    <PaperButton
      mode={mode}
      icon={icon}
      loading={loading}
      onPress={onPress}
      disabled={disabled || loading}
      buttonColor={
        variant === "danger"
          ? atlas.danger
          : variant === "primary"
            ? atlas.primary
            : undefined
      }
      textColor={
        variant === "danger" || variant === "primary"
          ? "#FFFFFF"
          : atlas.primaryDark
      }
      style={buttonStyle}
      contentStyle={styles.paperButtonContent}
      labelStyle={[styles.buttonText, styles[`${variant}ButtonText`]]}
    >
      {label}
    </PaperButton>
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
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <PaperTextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        mode="outlined"
        outlineColor={atlas.border}
        activeOutlineColor={atlas.primary}
        textColor={atlas.text}
        placeholderTextColor={atlas.textMuted}
        style={[
          styles.paperInput,
          multiline && styles.textArea,
          !editable && styles.inputDisabled,
        ]}
        contentStyle={styles.paperInputContent}
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
            style={({ pressed }) => [
              styles.headerBack,
              pressed && styles.headerBackPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={27}
              color="#fff"
            />
          </Pressable>
        ) : (
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={atlas.primary}
            />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.title, onBack && styles.titleWithBack]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, onBack && styles.subtitleWithBack]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {action ? <View style={styles.headerAction}>{action}</View> : null}
    </View>
  );
}

export function StatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  return (
    <View style={[styles.badge, badgeStyles[tone].container]}>
      <Text
        style={[styles.badgeText, badgeStyles[tone].text]}
        numberOfLines={1}
      >
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
        <MaterialCommunityIcons name={icon} size={28} color={atlas.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.emptyAction,
            pressed && styles.buttonPressed,
          ]}
        >
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.buttonPressed]}
    >
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
        <MaterialCommunityIcons
          name="magnify"
          size={21}
          color={atlas.textMuted}
        />
        <NativeTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={atlas.textMuted}
          style={styles.searchInput}
        />
        {value ? (
          <Pressable
            onPress={() => onChangeText("")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.searchClear,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={atlas.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {actionIcon ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.searchAction,
            pressed && styles.buttonPressed,
          ]}
        >
          <MaterialCommunityIcons name={actionIcon} size={20} color="#FFFFFF" />
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
        numberOfLines={1}
      >
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

export function LoadingState({
  variant = "spinner",
}: {
  variant?: "spinner" | "list";
}) {
  if (variant === "list") {
    return (
      <View style={styles.loadingList}>
        <SkeletonRows count={5} />
      </View>
    );
  }

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={atlas.primary} />
      <Text style={styles.loadingText}>Đang đồng bộ dữ liệu...</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.errorBanner}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={18}
        color={atlas.danger}
      />
      <Text style={styles.errorText}>{toVietnameseError(message)}</Text>
    </View>
  );
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.successBanner}>
      <MaterialCommunityIcons
        name="check-circle-outline"
        size={18}
        color={atlas.success}
      />
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
    <View
      style={[
        styles.summaryMetric,
        { backgroundColor: color.color, borderColor: color.color },
      ]}
    >
      <View style={styles.summaryMetricTop}>
        <Text style={styles.summaryMetricLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.summaryMetricIcon}>
          <MaterialCommunityIcons name={icon} size={14} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.summaryMetricValue} numberOfLines={1}>
        {value}
      </Text>
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
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.listCard,
          pressed && styles.buttonPressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.listCard, style]}>{children}</View>;
}

export function InfoGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.infoGrid}>{children}</View>;
}

export function Timeline({ children }: { children: React.ReactNode }) {
  return <View style={styles.timelineList}>{children}</View>;
}

export function TimelineItem({
  children,
  color = atlas.primary,
  bg = atlas.primarySoft,
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
        <View
          style={[
            styles.timelineDot,
            { backgroundColor: atlas.surface, borderColor: color },
          ]}
        >
          {icon ? (
            <MaterialCommunityIcons name={icon} size={15} color={color} />
          ) : (
            <Text style={[styles.timelineIndex, { color }]}>
              {typeof index === "number" ? index + 1 : ""}
            </Text>
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
      <View
        style={[styles.miniTimelineDot, done && styles.miniTimelineDotDone]}
      />
      {typeof index === "number" ? (
        <Text style={styles.miniTimelineIndex}>{index + 1}</Text>
      ) : null}
      <Text style={styles.miniTimelineTitle} numberOfLines={1}>
        {title}
      </Text>
      {meta ? (
        <Text
          style={[styles.miniTimelineMeta, done && styles.miniTimelineMetaDone]}
        >
          {meta}
        </Text>
      ) : null}
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
        const tone =
          step.state === "done"
            ? mockupTones.success
            : step.state === "active"
              ? mockupTones.primary
              : mockupTones.muted;
        return (
          <View key={step.key} style={styles.stepTimelineItem}>
            <View
              style={[
                styles.stepTimelineIcon,
                { backgroundColor: tone.color, borderColor: tone.color },
              ]}
            >
              <MaterialCommunityIcons
                name={step.icon}
                size={17}
                color="#FFFFFF"
              />
            </View>
            <Text
              style={[styles.stepTimelineText, { color: tone.color }]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.stepTimelineLine,
                  step.state !== "todo" && styles.stepTimelineLineActive,
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const badgeStyles: Record<
  BadgeTone,
  { container: ViewStyle; text: TextStyle }
> = {
  muted: {
    container: { backgroundColor: atlas.surfaceAlt, borderColor: atlas.border },
    text: { color: atlas.textSecondary },
  },
  success: {
    container: {
      backgroundColor: atlas.successSoft,
      borderColor: atlas.successSoft,
    },
    text: { color: atlas.success },
  },
  warning: {
    container: {
      backgroundColor: atlas.warningSoft,
      borderColor: atlas.warningSoft,
    },
    text: { color: atlas.warning },
  },
  danger: {
    container: {
      backgroundColor: atlas.dangerSoft,
      borderColor: atlas.dangerSoft,
    },
    text: { color: atlas.danger },
  },
  info: {
    container: {
      backgroundColor: atlas.primarySoft,
      borderColor: atlas.borderStrong,
    },
    text: { color: atlas.primary },
  },
};

const metricTones = {
  primary: { backgroundColor: "#2563EB" },
  accent: { backgroundColor: "#7C3AED" },
  route: { backgroundColor: "#0891B2" },
  success: { backgroundColor: "#059669" },
};

export function toneForStatus(status?: string): BadgeTone {
  if (
    status === "approved" ||
    status === "delivered" ||
    status === "completed" ||
    status === "checked_out"
  ) {
    return "success";
  }
  if (
    status === "pending" ||
    status === "planned" ||
    status === "in_progress" ||
    status === "checked_in"
  ) {
    return "warning";
  }
  if (status === "rejected" || status === "cancelled" || status === "returned")
    return "danger";
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
    gap: 14,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: "100%",
  },
  summaryStrip: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
  },
  summaryMetric: {
    alignItems: "flex-start",
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    justifyContent: "space-between",
    minHeight: 66,
    minWidth: 0,
    paddingHorizontal: 7,
    paddingVertical: 7,
    ...atlasSoftShadow,
  },
  summaryMetricTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  summaryMetricIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 5,
    height: 23,
    justifyContent: "center",
    width: 23,
  },
  summaryMetricValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 18,
  },
  summaryMetricLabel: {
    color: "rgba(255,255,255,0.92)",
    flex: 1,
    fontSize: 9.5,
    fontWeight: "600",
  },
  listCard: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderLeftColor: atlas.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 13,
    paddingHorizontal: 13,
    paddingVertical: 14,
    ...atlasSoftShadow,
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
    borderRadius: radius.md,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  timelineIndex: {
    fontSize: 10,
    fontWeight: "700",
  },
  timelineLine: {
    backgroundColor: atlas.border,
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
    backgroundColor: atlas.border,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  miniTimelineDotDone: {
    backgroundColor: atlas.success,
  },
  miniTimelineIndex: {
    color: atlas.textMuted,
    fontSize: 11,
    fontWeight: "700",
    width: 20,
  },
  miniTimelineTitle: {
    color: atlas.text,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  miniTimelineMeta: {
    color: atlas.warning,
    fontSize: 10,
    fontWeight: "700",
  },
  miniTimelineMetaDone: {
    color: atlas.success,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
    zIndex: 2,
  },
  stepTimelineText: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  stepTimelineLine: {
    backgroundColor: atlas.border,
    height: 2,
    left: "58%",
    position: "absolute",
    right: "-42%",
    top: 17,
  },
  stepTimelineLineActive: {
    backgroundColor: atlas.primary,
  },
  mockScreen: {
    alignSelf: "center",
    gap: 14,
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: "100%",
  },
  mockScreenCompact: {
    gap: 14,
    paddingHorizontal: 18,
  },
  mockHeader: {
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
  mockHeaderButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  mockHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  mockHeaderAction: {
    alignItems: "flex-end",
  },
  mockEyebrow: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  mockTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0,
  },
  mockSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  mockMetricCard: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 112,
    minWidth: 0,
    padding: 14,
    ...atlasSoftShadow,
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
    borderRadius: radius.lg,
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
    color: atlas.text,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 12,
  },
  mockMetricValueLarge: {
    fontSize: 30,
  },
  mockMetricLabel: {
    color: atlas.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  mockMetricNote: {
    fontSize: 11,
    fontWeight: "600",
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
    fontWeight: "600",
  },
  mockFilterTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mockSegmentedTabs: {
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexWrap: "nowrap",
    gap: 4,
    padding: 4,
  },
  mockFilterChip: {
    alignItems: "center",
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 14,
  },
  mockSegmentedChip: {
    borderColor: "transparent",
    borderRadius: radius.md,
    borderWidth: 0,
    flex: 1,
    paddingHorizontal: 8,
  },
  mockFilterChipActive: {
    backgroundColor: atlas.primary,
    borderColor: atlas.primary,
  },
  mockFilterText: {
    color: atlas.textSecondary,
    fontSize: 12,
    fontWeight: "600",
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
    backgroundColor: atlas.surfaceAlt,
  },
  mockAvatarText: {
    fontWeight: "600",
  },
  mockInfoCard: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...atlasSoftShadow,
  },
  mockInfoHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  mockInfoIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  mockInfoTitle: {
    color: atlas.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  mockInfoAction: {
    alignItems: "flex-end",
  },
  mockInfoBody: {
    gap: 10,
  },
  mockInfoRow: {
    alignItems: "flex-start",
    borderTopColor: atlas.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 10,
  },
  mockInfoLabel: {
    color: atlas.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  mockInfoValue: {
    color: atlas.text,
    flex: 1.3,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  mockInfoValueStrong: {
    color: atlas.primaryDark,
    fontSize: 15,
  },
  mockStepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  mockStepperButton: {
    alignItems: "center",
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  mockStepperInput: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: atlas.text,
    fontSize: 14,
    fontWeight: "600",
    height: 34,
    minWidth: 44,
    paddingHorizontal: 7,
    paddingVertical: 0,
    textAlign: "center",
  },
  mockProductRow: {
    alignItems: "center",
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 82,
    padding: 12,
    ...atlasSoftShadow,
  },
  mockProductImage: {
    borderRadius: radius.lg,
    height: 56,
    width: 56,
  },
  mockProductFallback: {
    alignItems: "center",
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
    borderRadius: radius.lg,
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
    color: atlas.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  mockProductSubtitle: {
    color: atlas.textSecondary,
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
    color: atlas.text,
    fontSize: 13,
    fontWeight: "600",
  },
  mockProductStock: {
    color: atlas.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  mockProductAction: {
    alignItems: "center",
  },
  card: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...atlasSoftShadow,
  },
  cardCompact: {
    padding: spacing.md,
  },
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...atlasSoftShadow,
  },
  paperButton: {
    borderRadius: radius.md,
    minHeight: 46,
    ...atlasSoftShadow,
  },
  paperButtonContent: {
    minHeight: 46,
    paddingHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: atlas.primary,
  },
  dangerButton: {
    backgroundColor: atlas.danger,
  },
  ghostButton: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderWidth: 1,
  },
  mutedButton: {
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
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
  ghostButtonText: { color: atlas.text },
  mutedButtonText: { color: atlas.primary },
  field: {
    gap: 7,
  },
  label: {
    color: atlas.text,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
  },
  input: {
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: atlas.text,
    fontSize: 14,
    lineHeight: 21,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...atlasSoftShadow,
  },
  paperInput: {
    backgroundColor: atlas.surface,
    fontSize: 14,
    minHeight: 48,
  },
  paperInputContent: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputFocused: {
    borderColor: atlas.primary,
    backgroundColor: "#fff",
    shadowOpacity: 0.12,
  },
  inputDisabled: {
    opacity: 0.52,
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
    backgroundColor: atlas.primary,
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
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  headerBack: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radius.md,
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
    color: atlas.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 24,
  },
  titleWithBack: {
    color: "#fff",
    fontSize: 19,
    textAlign: "center",
  },
  subtitle: {
    color: atlas.textSecondary,
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
    fontWeight: "700",
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
    borderRadius: radius.md,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  metricBody: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    color: atlas.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
  },
  metricValue: {
    color: atlas.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 1,
  },
  metricNote: {
    color: atlas.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  empty: {
    alignItems: "center",
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  emptyTitle: {
    color: atlas.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyMessage: {
    color: atlas.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  emptyAction: {
    alignItems: "center",
    backgroundColor: atlas.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  loading: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 180,
    padding: spacing.xl,
  },
  loadingText: {
    color: atlas.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingList: {
    padding: spacing.lg,
  },
  fab: {
    alignItems: "center",
    backgroundColor: atlas.primary,
    borderColor: atlas.primaryDark,
    borderWidth: 1,
    borderRadius: radius.lg,
    bottom: 86,
    height: 58,
    justifyContent: "center",
    position: "absolute",
    right: 22,
    width: 58,
    ...atlasSoftShadow,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    ...atlasSoftShadow,
  },
  searchInput: {
    color: atlas.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    outlineStyle: "none" as never,
  },
  searchAction: {
    alignItems: "center",
    backgroundColor: atlas.primary,
    borderColor: atlas.primaryDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
    ...atlasSoftShadow,
  },
  searchClear: {
    alignItems: "center",
    backgroundColor: atlas.surfaceAlt,
    borderColor: atlas.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  filterChipActive: {
    backgroundColor: atlas.primary,
    borderColor: atlas.primary,
  },
  filterChipText: {
    color: atlas.textSecondary,
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
    backgroundColor: atlas.surface,
    borderColor: atlas.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 78,
    padding: spacing.md,
  },
  skeletonAvatar: {
    backgroundColor: atlas.primarySoft,
    borderRadius: radius.lg,
    height: 44,
    width: 44,
  },
  skeletonBody: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLineWide: {
    backgroundColor: atlas.surfaceAlt,
    borderRadius: 999,
    height: 12,
    width: "72%",
  },
  skeletonLine: {
    backgroundColor: atlas.border,
    borderRadius: 999,
    height: 10,
    width: "48%",
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: atlas.dangerSoft,
    borderColor: atlas.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    color: atlas.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  successBanner: {
    alignItems: "center",
    backgroundColor: atlas.successSoft,
    borderColor: atlas.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  successText: {
    color: atlas.success,
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  row: {
    alignItems: "flex-start",
    borderTopColor: atlas.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  rowLabel: {
    color: atlas.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  rowValue: {
    color: atlas.text,
    flex: 1.35,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
});
