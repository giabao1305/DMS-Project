import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import {
  getStoredSession,
  onSessionExpired,
  signOut,
  type Session,
} from "./src/api/authStore";
import { ApiProvider } from "./src/api/ApiProvider";
import { AppShell, type SellerTab } from "./src/components/AppShell";
import { bento, palette, paperTheme } from "./src/theme";
import { LoginScreen } from "./src/screens/LoginScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { CustomersScreen } from "./src/screens/CustomersScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LeavesScreen } from "./src/screens/LeavesScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RoutesScreen } from "./src/screens/RoutesScreen";
import { VisitsScreen } from "./src/screens/VisitsScreen";
import { KpisScreen } from "./src/screens/KpisScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { RefreshProvider } from "./src/hooks/RefreshContext";

type VisitCreateIntent = {
  routeId?: string;
  customerId?: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(() =>
    getStoredSession(),
  );
  const [activeTab, setActiveTab] = useState<SellerTab>("dashboard");
  const [visitCreateIntent, setVisitCreateIntent] =
    useState<VisitCreateIntent | null>(null);
  const [orderCreateCustomerId, setOrderCreateCustomerId] = useState<
    string | null
  >(null);
  const [paymentReturnOrderId, setPaymentReturnOrderId] = useState<
    string | null
  >(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    return onSessionExpired(() => {
      setSession(null);
      setActiveTab("dashboard");
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const orderId = extractVnpayReturnOrderId(url);
      if (!orderId) return;
      setPaymentReturnOrderId(orderId);
      setActiveTab("orders");
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handleUrl(url),
    );

    return () => subscription.remove();
  }, []);

  const apiContext = useMemo(
    () => ({
      session,
      setSession,
    }),
    [session],
  );

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setActiveTab("dashboard");
    setVisitCreateIntent(null);
  };

  const openVisitCreate = (intent: VisitCreateIntent) => {
    setVisitCreateIntent(intent);
    setActiveTab("visits");
  };

  const openOrderCreate = (customerId?: string) => {
    setOrderCreateCustomerId(customerId || "");
    setActiveTab("orders");
  };

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <SafeAreaView
            style={[styles.safeArea, styles.splashSafeArea]}
            edges={["right", "left"]}
          >
            <StatusBar
              style="light"
              backgroundColor={bento.primary}
              translucent={false}
            />
            <SplashScreen />
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <SafeAreaView
            style={[styles.safeArea, styles.loginSafeArea]}
            edges={["right", "left"]}
          >
            <StatusBar
              style="light"
              backgroundColor={bento.primary}
              translucent={false}
            />
            <ApiProvider value={apiContext}>
              <LoginScreen onLogin={setSession} />
            </ApiProvider>
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <SafeAreaView
          style={[
            styles.safeArea,
            styles.authSafeArea,
            activeTab === "dashboard" && styles.dashboardSafeArea,
          ]}
          edges={["top", "right", "left"]}
        >
          <StatusBar
            style="light"
            backgroundColor="#103494"
            translucent={false}
          />
          <ApiProvider value={apiContext}>
            <RefreshProvider>
              <AppShell
                activeTab={activeTab}
                user={session.user}
                onChangeTab={setActiveTab}
                onLogout={handleLogout}
              >
                {activeTab === "dashboard" && (
                  <DashboardScreen
                    user={session.user}
                    onOpenTab={setActiveTab}
                    onCreateOrder={openOrderCreate}
                    onCreateVisit={openVisitCreate}
                  />
                )}
                {activeTab === "customers" && (
                  <CustomersScreen
                    onCreateOrder={openOrderCreate}
                    onCreateVisit={openVisitCreate}
                    onOpenTab={setActiveTab}
                  />
                )}
                {activeTab === "routes" && (
                  <RoutesScreen
                    user={session.user}
                    onOpenTab={setActiveTab}
                    onCreateVisit={openVisitCreate}
                  />
                )}
                {activeTab === "orders" && (
                  <OrdersScreen
                    initialCustomerId={orderCreateCustomerId}
                    onInitialCustomerConsumed={() =>
                      setOrderCreateCustomerId(null)
                    }
                    paymentReturnOrderId={paymentReturnOrderId}
                    onPaymentReturnConsumed={() =>
                      setPaymentReturnOrderId(null)
                    }
                    onOpenTab={setActiveTab}
                  />
                )}
                {activeTab === "visits" && (
                  <VisitsScreen
                    onOpenTab={setActiveTab}
                    onCreateOrder={openOrderCreate}
                    initialCreateIntent={visitCreateIntent}
                    onInitialCreateIntentConsumed={() =>
                      setVisitCreateIntent(null)
                    }
                  />
                )}
                {activeTab === "kpis" && (
                  <KpisScreen onOpenTab={setActiveTab} />
                )}
                {activeTab === "leaves" && (
                  <LeavesScreen onOpenTab={setActiveTab} />
                )}
                {activeTab === "notifications" && (
                  <NotificationsScreen onOpenTab={setActiveTab} />
                )}
                {activeTab === "profile" && (
                  <ProfileScreen onLogout={handleLogout} />
                )}
                {activeTab === "more" && (
                  <MoreScreen
                    user={session.user}
                    onOpenTab={setActiveTab}
                    onLogout={handleLogout}
                  />
                )}
              </AppShell>
            </RefreshProvider>
          </ApiProvider>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function extractVnpayReturnOrderId(url: string | null) {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);
    const queryOrderId =
      parsedUrl.searchParams.get("vnpayOrderId") ||
      parsedUrl.searchParams.get("orderId");

    if (queryOrderId) return queryOrderId;

    if (parsedUrl.protocol === "dmsseller:" && parsedUrl.hostname === "orders") {
      const orderId = parsedUrl.pathname.replace(/^\/+/, "").split("/")[0];
      return orderId || undefined;
    }
  } catch {
    const match = url.match(/(?:vnpayOrderId|orderId)=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  return undefined;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  splashSafeArea: {
    backgroundColor: bento.primary,
  },
  authSafeArea: {
    backgroundColor: "#103494",
  },
  dashboardSafeArea: {
    backgroundColor: "#103494",
  },
  loginSafeArea: {
    backgroundColor: bento.primary,
  },
});
