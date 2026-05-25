import { useState } from "react";

import { sellerApi } from "../api/sellerApi";
import { LoadingState } from "../components/Ui";
import { useResource } from "../hooks/useResource";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import type { SellerTab } from "../components/AppShell";
import type { RoutePlan } from "../types/domain";
import { RouteDetail } from "./routes/RouteDetail";
import { RoutesList } from "./routes/RoutesList";

type VisitCreateIntent = {
  routeId?: string;
  customerId?: string;
};

export function RoutesScreen({
  onOpenTab,
  onCreateVisit,
}: {
  onOpenTab: (tab: SellerTab) => void;
  onCreateVisit: (intent: VisitCreateIntent) => void;
}) {
  const { data, loading, error, reload } = useResource(sellerApi.routes, []);
  const [detail, setDetail] = useState<RoutePlan | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingRouteId, setUpdatingRouteId] = useState("");
  useRegisterRefresh(reload, [reload]);

  const updateStatus = async (route: RoutePlan, status: "in_progress" | "completed") => {
    setUpdatingRouteId(route._id);
    setActionError("");
    setActionMessage("");
    try {
      const updated = await sellerApi.updateRouteStatus(route._id, status);
      await reload();
      setDetail(updated);
      setActionMessage(status === "in_progress" ? "Đã bắt đầu tuyến." : "Đã hoàn thành tuyến.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không cập nhật được trạng thái tuyến");
    } finally {
      setUpdatingRouteId("");
    }
  };

  if (loading) return <LoadingState variant="list" />;

  if (detail) {
    return (
      <RouteDetail
        route={detail}
        onBack={() => setDetail(null)}
        onCreateVisit={onCreateVisit}
        onUpdateStatus={updateStatus}
        actionError={actionError}
        actionMessage={actionMessage}
        updating={updatingRouteId === detail._id}
      />
    );
  }

  return (
    <RoutesList
      routes={data || []}
      error={error}
      actionError={actionError}
      actionMessage={actionMessage}
      updatingRouteId={updatingRouteId}
      onBack={() => onOpenTab("dashboard")}
      onDetail={setDetail}
      onUpdateStatus={updateStatus}
    />
  );
}


