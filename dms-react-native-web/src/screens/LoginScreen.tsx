import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button as PaperButton,
  TextInput as PaperTextInput,
} from "react-native-paper";

import { storeSession, type Session } from "../api/authStore";
import { sellerApi } from "../api/sellerApi";
import { atlas, radius } from "../theme";
import { toVietnameseError } from "../utils/errorMessage";

const inputCaretColor = "#0F172A";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function LoginScreen({
  onLogin,
}: {
  onLogin: (session: Session) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canSubmit = useMemo(
    () => Boolean(email.trim() && password.trim()),
    [email, password],
  );

  const submit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const session = (await sellerApi.login({
        email: email.trim(),
        password,
      })) as Session;

      if (session.user.role !== "seller") {
        setError("Tài khoản này không được phép đăng nhập app bán hàng.");
        return;
      }

      storeSession(session);
      onLogin(session);
    } catch (err) {
      setError(
        toVietnameseError(
          err instanceof Error ? err.message : "Đăng nhập thất bại",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const showForgotHelp = () => {
    setError("");
    setInfo("Vui lòng liên hệ quản trị viên để cấp lại mật khẩu.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Image
                source={require("../../assets/favicon.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.appName}>DMS Seller</Text>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>
              Quản lý tuyến, khách hàng và đơn hàng
            </Text>
          </View>

          <View style={styles.form}>
            <LoginField
              label="Email / số điện thoại"
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email hoặc số điện thoại"
              icon="account-outline"
              keyboardType="email-address"
            />

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu</Text>

              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={18}
                    color={atlas.primary}
                  />
                </View>

                <PaperTextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Nhập mật khẩu"
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  cursorColor={inputCaretColor}
                  selectionColor="#BFD7FF"
                  textColor={atlas.text}
                  placeholderTextColor={atlas.textMuted}
                  style={styles.input}
                  contentStyle={styles.paperInputContent}
                />

                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  hitSlop={10}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color={atlas.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.optionRow}>
              <Pressable
                onPress={() => setRemember((value) => !value)}
                style={({ pressed }) => [
                  styles.remember,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={13}
                      color="#FFFFFF"
                    />
                  ) : null}
                </View>
                <Text style={styles.optionText}>Ghi nhớ</Text>
              </Pressable>

              <Pressable
                onPress={showForgotHelp}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.forgot}>Quên mật khẩu?</Text>
              </Pressable>
            </View>

            {info ? <MessageBox type="info" message={info} /> : null}
            {error ? <MessageBox type="error" message={error} /> : null}

            <PaperButton
              mode="contained"
              onPress={submit}
              disabled={!canSubmit || loading}
              buttonColor={atlas.primary}
              textColor="#FFFFFF"
              style={[
                styles.loginButton,
                (!canSubmit || loading) && styles.disabled,
              ]}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginText}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : "Đăng nhập"}
            </PaperButton>

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
        <View style={styles.inputIcon}>
          <MaterialCommunityIcons name={icon} size={18} color={atlas.primary} />
        </View>

        <PaperTextInput
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          keyboardType={keyboardType}
          placeholder={placeholder}
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={inputCaretColor}
          selectionColor="#BFD7FF"
          textColor={atlas.text}
          placeholderTextColor={atlas.textMuted}
          style={styles.input}
          contentStyle={styles.paperInputContent}
        />
      </View>
    </View>
  );
}

function MessageBox({
  type,
  message,
}: {
  type: "info" | "error";
  message: string;
}) {
  const isError = type === "error";

  return (
    <View
      style={[styles.messageBox, isError ? styles.errorBox : styles.infoBox]}
    >
      <MaterialCommunityIcons
        name={isError ? "alert-circle-outline" : "information-outline"}
        size={17}
        color={isError ? atlas.danger : atlas.primary}
      />
      <Text style={[styles.messageText, isError && styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: atlas.primary,
  },
  content: {
    backgroundColor: atlas.primary,
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: "center",
  },
  card: {
    alignSelf: "center",
    backgroundColor: atlas.surface,
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 400,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    width: "100%",
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  logo: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: atlas.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    height: 74,
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
    width: 74,
  },
  logoImage: {
    borderRadius: 14,
    height: 62,
    width: 62,
  },
  appName: {
    color: atlas.primary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  title: {
    color: atlas.text,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    color: atlas.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  form: {
    gap: 15,
  },
  field: {
    gap: 8,
  },
  label: {
    color: atlas.text,
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrap: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 13,
    borderRadius: radius.lg,
    backgroundColor: atlas.chromeSoft,
    borderWidth: 1,
    borderColor: atlas.border,
  },
  inputIcon: {
    alignItems: "center",
    backgroundColor: atlas.primarySoft,
    borderRadius: radius.md,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "transparent",
    color: atlas.text,
    fontSize: 14,
    fontWeight: "600",
    outlineStyle: "none" as never,
    ...(Platform.OS === "web"
      ? ({ caretColor: inputCaretColor } as never)
      : {}),
  },
  paperInputContent: {
    paddingHorizontal: 0,
    fontSize: 14,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remember: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: atlas.border,
    backgroundColor: atlas.surface,
  },
  checkboxOn: {
    backgroundColor: atlas.primary,
    borderColor: atlas.primary,
  },
  optionText: {
    color: atlas.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  forgot: {
    color: atlas.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoBox: {
    backgroundColor: atlas.primarySoft,
    borderColor: atlas.borderStrong,
  },
  errorBox: {
    backgroundColor: atlas.dangerSoft,
    borderColor: "#FECACA",
  },
  messageText: {
    flex: 1,
    color: atlas.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  errorText: {
    color: atlas.danger,
  },
  loginButton: {
    marginTop: 4,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  loginButtonContent: {
    minHeight: 56,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.48,
  },
});
