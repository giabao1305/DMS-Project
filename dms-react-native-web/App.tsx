import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { getStoredSession, onSessionExpired, signOut, type Session } from "./src/api/authStore";
import { ApiProvider } from "./src/api/ApiProvider";
import { AppShell, type SellerTab } from "./src/components/AppShell";
import { bento, palette } from "./src/theme";
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
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const [activeTab, setActiveTab] = useState<SellerTab>("dashboard");
  const [visitCreateIntent, setVisitCreateIntent] = useState<VisitCreateIntent | null>(null);
  const [orderCreateCustomerId, setOrderCreateCustomerId] = useState<string | null>(null);
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
        <SafeAreaView style={[styles.safeArea, styles.splashSafeArea]} edges={["top", "right", "bottom", "left"]}>
          <StatusBar style="light" backgroundColor={bento.chrome} translucent={false} />
          <SplashScreen />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safeArea, styles.loginSafeArea]} edges={["top", "right", "bottom", "left"]}>
          <StatusBar style="dark" backgroundColor={bento.background} translucent={false} />
          <ApiProvider value={apiContext}>
            <LoginScreen onLogin={setSession} />
          </ApiProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, styles.authSafeArea, activeTab === "dashboard" && styles.dashboardSafeArea]} edges={["top", "right", "left"]}>
        <StatusBar style="light" backgroundColor={activeTab === "dashboard" ? bento.chrome : palette.dark} translucent={false} />
        <ApiProvider value={apiContext}>
          <RefreshProvider>
            <AppShell
              activeTab={activeTab}
              user={session.user}
              onChangeTab={setActiveTab}
              onLogout={handleLogout}
            >
              {activeTab === "dashboard" && <DashboardScreen user={session.user} onOpenTab={setActiveTab} />}
              {activeTab === "customers" && (
                <CustomersScreen
                  onCreateOrder={openOrderCreate}
                  onCreateVisit={openVisitCreate}
                  onOpenTab={setActiveTab}
                />
              )}
              {activeTab === "routes" && <RoutesScreen onOpenTab={setActiveTab} onCreateVisit={openVisitCreate} />}
              {activeTab === "orders" && (
                <OrdersScreen
                  initialCustomerId={orderCreateCustomerId}
                  onInitialCustomerConsumed={() => setOrderCreateCustomerId(null)}
                  onOpenTab={setActiveTab}
                />
              )}
              {activeTab === "visits" && (
                <VisitsScreen
                  onOpenTab={setActiveTab}
                  initialCreateIntent={visitCreateIntent}
                  onInitialCreateIntentConsumed={() => setVisitCreateIntent(null)}
                />
              )}
              {activeTab === "kpis" && <KpisScreen onOpenTab={setActiveTab} />}
              {activeTab === "leaves" && <LeavesScreen onOpenTab={setActiveTab} />}
              {activeTab === "notifications" && <NotificationsScreen onOpenTab={setActiveTab} />}
              {activeTab === "profile" && <ProfileScreen onLogout={handleLogout} />}
              {activeTab === "more" && <MoreScreen onOpenTab={setActiveTab} onLogout={handleLogout} />}
            </AppShell>
          </RefreshProvider>
        </ApiProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  splashSafeArea: {
    backgroundColor: bento.chrome,
  },
  authSafeArea: {
    backgroundColor: palette.dark,
  },
  dashboardSafeArea: {
    backgroundColor: bento.chrome,
  },
  loginSafeArea: {
    backgroundColor: bento.background,
  },
});
