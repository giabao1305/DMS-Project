import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useApiContext } from "../api/ApiProvider";
import { storeSession } from "../api/authStore";
import { sellerApi } from "../api/sellerApi";
import { ErrorBanner, Field, PrimaryButton } from "../components/Ui";
import { bento, bentoSoftShadow } from "../theme";
import { toVietnameseError } from "../utils/errorMessage";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tone = { color: string; bg: string };

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { session, setSession } = useApiContext();
  const user = session?.user;
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarUrl = editing ? avatar.trim() : user?.avatar;

  const pickAvatar = async () => {
    setError("");
    setMessage("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("App cần quyền truy cập thư viện ảnh để chọn avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setAvatarLoading(true);
    try {
      const uploaded = await sellerApi.uploadImage({
        uri: asset.uri,
        fileName: asset.fileName || `avatar-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
      });
      setAvatar(uploaded.imageUrl);
      setMessage("Đã chọn ảnh đại diện. Bấm lưu hồ sơ để cập nhật.");
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không upload được ảnh đại diện"));
    } finally {
      setAvatarLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!session?.user._id) return;
    setProfileLoading(true);
    setError("");
    setMessage("");
    try {
      const updated = await sellerApi.updateProfile({
        fullName,
        phone: phone || undefined,
        companyName: companyName || undefined,
        avatar: avatar.trim(),
      });
      const nextSession = { ...session, user: { ...session.user, ...updated } };
      storeSession(nextSession);
      setSession(nextSession);
      setEditing(false);
      setMessage("Đã cập nhật hồ sơ.");
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không cập nhật được hồ sơ"));
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await sellerApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Đã đổi mật khẩu.");
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Không đổi được mật khẩu"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SELLER PROFILE</Text>
            <Text style={styles.title}>Hồ sơ cá nhân</Text>
          </View>
          <Pressable onPress={() => setEditing((value) => !value)} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons name={editing ? "close" : "pencil"} size={20} color={editing ? bento.danger : bento.primary} />
          </Pressable>
        </View>

        <ErrorBanner message={error} />
        {message ? (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={bento.success} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarBox}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial(user?.fullName)}</Text>}
            </View>
            <View style={[styles.statusDot, !user?.isActive && styles.statusDotOff]} />
          </View>
          <Text style={styles.roleLabel}>{roleLabel(user?.role)}</Text>
          <Text style={styles.name} numberOfLines={2}>{user?.fullName || user?.email || "Seller"}</Text>
          <Text style={styles.email} numberOfLines={1}>{user?.email || "-"}</Text>
        </View>

        {editing ? (
          <View style={styles.card}>
            <SectionHeader icon="account-edit-outline" title="Cập nhật hồ sơ" subtitle="Thông tin này dùng cho tài khoản bán hàng." tone={{ color: bento.primary, bg: bento.primarySoft }} />
            <View style={styles.avatarActions}>
              <PrimaryButton label="Chọn ảnh" onPress={pickAvatar} loading={avatarLoading} variant="muted" icon="image-plus" style={styles.avatarActionButton} />
              {avatar ? <PrimaryButton label="Xóa ảnh" onPress={() => setAvatar("")} variant="ghost" icon="trash-can-outline" style={styles.avatarActionButton} /> : null}
            </View>
            <Field label="Họ tên" value={fullName} onChangeText={setFullName} />
            <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Công ty" value={companyName} onChangeText={setCompanyName} />
            <PrimaryButton label="Lưu hồ sơ" onPress={saveProfile} loading={profileLoading} disabled={!fullName || avatarLoading} icon="content-save" />
          </View>
        ) : (
          <View style={styles.infoCard}>
            <ProfileRow icon="phone-outline" label="SĐT" value={user?.phone || "Chưa có"} tone={{ color: bento.primary, bg: bento.primarySoft }} />
            <ProfileRow icon="email-outline" label="Email" value={user?.email || "-"} tone={{ color: bento.route, bg: bento.routeSoft }} />
            <ProfileRow icon="office-building-outline" label="Khu vực" value={user?.companyName || "Chưa có"} tone={{ color: bento.success, bg: bento.successSoft }} />
            <ProfileRow icon="account-tie-outline" label="Quản lý trực tiếp" value={roleLabel(user?.role)} tone={{ color: bento.warning, bg: bento.warningSoft }} />
          </View>
        )}

        <View style={styles.card}>
          <SectionHeader icon="lock-reset" title="Đổi mật khẩu" subtitle="Dùng mật khẩu mạnh để bảo vệ phiên bán hàng." tone={{ color: bento.warning, bg: bento.warningSoft }} />
          <Field label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Field label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <PrimaryButton label="Cập nhật mật khẩu" onPress={changePassword} loading={loading} disabled={!currentPassword || !newPassword} icon="lock-reset" />
        </View>

        <View style={styles.settingsCard}>
          <SettingRow icon="palette-outline" title="Đổi màu kiểu" subtitle="Theo chuẩn DMS Seller" tone={{ color: bento.primary, bg: bento.primarySoft }} />
          <SettingRow icon="translate" title="Đổi khu vực" subtitle={user?.companyName || "Chưa thiết lập"} tone={{ color: bento.route, bg: bento.routeSoft }} />
          <Pressable onPress={onLogout} style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}>
            <View style={[styles.settingIcon, { backgroundColor: bento.dangerSoft }]}>
              <MaterialCommunityIcons name="logout" size={19} color={bento.danger} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Đăng xuất</Text>
              <Text style={styles.settingSubtitle}>Kết thúc phiên làm việc hiện tại</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={21} color={bento.textMuted} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ icon, title, subtitle, tone }: { icon: IconName; title: string; subtitle: string; tone: Tone }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: tone.bg }]}>
        <MaterialCommunityIcons name={icon} size={19} color={tone.color} />
      </View>
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ProfileRow({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone: Tone }) {
  return (
    <View style={styles.profileRow}>
      <View style={[styles.profileRowIcon, { backgroundColor: tone.bg }]}>
        <MaterialCommunityIcons name={icon} size={19} color={tone.color} />
      </View>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function SettingRow({ icon, title, subtitle, tone }: { icon: IconName; title: string; subtitle: string; tone: Tone }) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: tone.bg }]}>
        <MaterialCommunityIcons name={icon} size={19} color={tone.color} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={21} color={bento.textMuted} />
    </View>
  );
}

function roleLabel(role?: string) {
  if (role === "admin") return "Quản trị";
  if (role === "distributor") return "Nhà phân phối";
  return "Nhân viên bán hàng";
}

function initial(name?: string) {
  return (name || "S").trim().at(0)?.toUpperCase();
}

const styles = StyleSheet.create({
  screen: { backgroundColor: bento.background, flex: 1 },
  scrollContent: { minHeight: "100%", paddingBottom: 26 },
  page: { alignSelf: "center", gap: 14, maxWidth: 760, paddingHorizontal: 16, paddingTop: 16, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: bento.textMuted, fontSize: 11, fontWeight: "900" },
  title: { color: bento.text, fontSize: 24, fontWeight: "900", marginTop: 2 },
  editButton: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44, ...bentoSoftShadow },
  successBanner: { alignItems: "center", backgroundColor: bento.successSoft, borderColor: "#BBF7D0", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, padding: 12 },
  successText: { color: bento.success, flex: 1, fontSize: 13, fontWeight: "800" },
  hero: { alignItems: "center", backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 22, borderWidth: 1, gap: 8, padding: 20, ...bentoSoftShadow },
  avatarWrap: { marginBottom: 4, position: "relative" },
  avatarBox: { alignItems: "center", backgroundColor: bento.primarySoft, borderColor: bento.borderStrong, borderRadius: 24, borderWidth: 3, height: 88, justifyContent: "center", overflow: "hidden", width: 88 },
  avatarImage: { height: "100%", resizeMode: "cover", width: "100%" },
  avatarText: { color: bento.primary, fontSize: 31, fontWeight: "900" },
  statusDot: { backgroundColor: bento.success, borderColor: bento.surface, borderRadius: 9, borderWidth: 3, bottom: 4, height: 20, position: "absolute", right: 4, width: 20 },
  statusDotOff: { backgroundColor: bento.danger },
  roleLabel: { color: bento.primaryDark, fontSize: 12, fontWeight: "900" },
  name: { color: bento.text, fontSize: 22, fontWeight: "900", lineHeight: 28, textAlign: "center" },
  email: { color: bento.textSecondary, fontSize: 13, fontWeight: "800" },
  infoCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, overflow: "hidden", ...bentoSoftShadow },
  profileRow: { alignItems: "center", borderBottomColor: bento.border, borderBottomWidth: 1, flexDirection: "row", gap: 11, minHeight: 66, paddingHorizontal: 14, paddingVertical: 10 },
  profileRowIcon: { alignItems: "center", borderRadius: 13, height: 40, justifyContent: "center", width: 40 },
  profileLabel: { color: bento.textSecondary, flex: 0.8, fontSize: 12, fontWeight: "900" },
  profileValue: { color: bento.text, flex: 1.3, fontSize: 13, fontWeight: "900", textAlign: "right" },
  card: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, gap: 13, padding: 15, ...bentoSoftShadow },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  sectionIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { color: bento.text, fontSize: 16, fontWeight: "900" },
  sectionSubtitle: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 2 },
  avatarActions: { flexDirection: "row", gap: 9 },
  avatarActionButton: { flex: 1 },
  settingsCard: { backgroundColor: bento.surface, borderColor: bento.border, borderRadius: 18, borderWidth: 1, overflow: "hidden", ...bentoSoftShadow },
  settingRow: { alignItems: "center", borderBottomColor: bento.border, borderBottomWidth: 1, flexDirection: "row", gap: 12, minHeight: 68, padding: 13 },
  logoutRow: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 68, padding: 13 },
  settingIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  settingText: { flex: 1, minWidth: 0 },
  settingTitle: { color: bento.text, fontSize: 14, fontWeight: "900" },
  settingSubtitle: { color: bento.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 3 },
  dangerText: { color: bento.danger },
  pressed: { opacity: 0.72 },
});
