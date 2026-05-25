import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { storeSession, type Session } from "../api/authStore";
import { sellerApi } from "../api/sellerApi";
import { bento, bentoSoftShadow } from "../theme";
import { toVietnameseError } from "../utils/errorMessage";

const demoEmail = "quocandsr1@gmail.com";
const demoPassword = "123456";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canSubmit = useMemo(() => Boolean(email.trim() && password.trim()), [email, password]);

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const session = (await sellerApi.login({ email: email.trim(), password })) as Session;
      if (session.user.role !== "seller") {
        setError("Tài khoản này không phải nhân viên bán hàng.");
        return;
      }
      storeSession(session);
      onLogin(session);
    } catch (err) {
      setError(toVietnameseError(err instanceof Error ? err.message : "Đăng nhập thất bại"));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setInfo("Đã điền tài khoản demo để kiểm thử nhanh.");
  };

  const showForgotHelp = () => {
    setError("");
    setInfo("Vui lòng liên hệ quản trị viên để cấp lại mật khẩu.");
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>D</Text>
            </View>
            <Text style={styles.brandName}>DMS SELLER</Text>
          </View>

          <View style={styles.formHeader}>
            <View>
              <Text style={styles.title}>Đăng nhập tài khoản</Text>
              <Text style={styles.subtitle}>Vào ca để quản lý tuyến, đơn hàng và khách hàng.</Text>
            </View>
            <Pressable onPress={fillDemoAccount} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="lightning-bolt-outline" size={15} color={bento.primaryDark} />
              <Text style={styles.demoButtonText}>Demo</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <LoginField
              label="Số điện thoại / email"
              value={email}
              onChangeText={setEmail}
              placeholder="0901 234 567 hoặc email"
              icon="account-outline"
              keyboardType="email-address"
            />

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={bento.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={bento.textMuted}
                  style={styles.input}
                />
                <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={bento.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.optionRow}>
              <Pressable onPress={() => setRemember((value) => !value)} style={({ pressed }) => [styles.remember, pressed && styles.pressed]}>
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.optionText}>Ghi nhớ đăng nhập</Text>
              </Pressable>
              <Pressable onPress={showForgotHelp} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
                <Text style={styles.forgot}>Quên mật khẩu?</Text>
              </Pressable>
            </View>

            {info ? <MessageBox type="info" message={info} /> : null}
            {error ? <MessageBox type="error" message={error} /> : null}

            <Pressable
              onPress={submit}
              disabled={!canSubmit || loading}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed, (!canSubmit || loading) && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginText}>Đăng nhập</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.supportBox}>
            <MaterialCommunityIcons name="shield-account-outline" size={18} color={bento.primaryDark} />
            <Text style={styles.supportText}>Tài khoản seller được cấp bởi quản trị viên DMS.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LoginField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: IconName;
  keyboardType?: "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={bento.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={bento.textMuted}
          style={styles.input}
        />
      </View>
    </View>
  );
}

function MessageBox({ type, message }: { type: "info" | "error"; message: string }) {
  const isError = type === "error";
  return (
    <View style={[styles.messageBox, isError ? styles.errorBox : styles.infoBox]}>
      <MaterialCommunityIcons name={isError ? "alert-circle-outline" : "information-outline"} size={17} color={isError ? bento.danger : bento.primaryDark} />
      <Text style={[styles.messageText, isError ? styles.errorText : styles.infoText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: bento.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    backgroundColor: bento.background,
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  page: {
    gap: 20,
    maxWidth: 410,
    width: "100%",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28,
    ...bentoSoftShadow,
  },
  brandLetter: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  brandName: {
    color: bento.text,
    fontSize: 16,
    fontWeight: "900",
  },
  formHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 6,
  },
  title: {
    color: bento.text,
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 250,
  },
  demoButton: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  demoButtonText: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  form: {
    gap: 15,
  },
  field: {
    gap: 8,
  },
  label: {
    color: bento.text,
    fontSize: 12,
    fontWeight: "800",
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    ...bentoSoftShadow,
  },
  input: {
    color: bento.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 0,
    outlineStyle: "none" as never,
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  remember: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: bento.surface,
    borderColor: bento.border,
    borderRadius: 4,
    borderWidth: 1,
    height: 17,
    justifyContent: "center",
    width: 17,
  },
  checkboxOn: {
    backgroundColor: bento.primary,
    borderColor: bento.primary,
  },
  optionText: {
    color: bento.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  forgot: {
    color: bento.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  loginButton: {
    alignItems: "center",
    backgroundColor: bento.primary,
    borderRadius: 11,
    height: 48,
    justifyContent: "center",
    marginTop: 3,
    shadowColor: bento.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  messageBox: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 11,
  },
  infoBox: {
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
  },
  errorBox: {
    backgroundColor: bento.dangerSoft,
    borderColor: "#FFCACA",
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  infoText: {
    color: bento.primaryDark,
  },
  errorText: {
    color: bento.danger,
  },
  supportBox: {
    alignItems: "center",
    backgroundColor: bento.primarySoft,
    borderColor: bento.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  supportText: {
    color: bento.primaryDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.48,
  },
});

