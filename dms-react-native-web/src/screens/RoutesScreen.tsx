import { useState } from "react";

import { sellerApi } from "../api/sellerApi";
import { LoadingState } from "../components/Ui";
import { useResource } from "../hooks/useResource";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import type { SellerTab } from "../components/AppShell";
import type { AuthUser, RoutePlan } from "../types/domain";
import { RouteDetail } from "./routes/RouteDetail";
import { RoutesList } from "./routes/RoutesList";

type VisitCreateIntent = {
  routeId?: string;
  customerId?: string;
};

export function RoutesScreen({
  user,
  onOpenTab,
  onCreateVisit,
}: {
  user: AuthUser;
  onOpenTab: (tab: SellerTab) => void;
  onCreateVisit: (intent: VisitCreateIntent) => void;
}) {
  const { data, loading, error, reload, setData } = useResource(sellerApi.routes, []);
  const [detail, setDetail] = useState<RoutePlan | null>(null);
  useRegisterRefresh(reload, [reload]);

  if (loading) return <LoadingState variant="list" />;

  if (detail) {
    return (
      <RouteDetail
        route={detail}
        user={user}
        onBack={() => setDetail(null)}
        onCreateVisit={onCreateVisit}
        onChanged={(route) => {
          setDetail(route);
          setData((routes) =>
            routes?.map((item) => (item._id === route._id ? route : item)) ||
            routes,
          );
        }}
      />
    );
  }

  return (
    <RoutesList
      routes={data || []}
      user={user}
      error={error}
      onBack={() => onOpenTab("more")}
      onDetail={setDetail}
    />
  );
}
