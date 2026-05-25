import { useCallback, useEffect, useMemo, useState } from "react";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { LoadingState } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import type { Visit } from "../types/domain";
import { VisitCreate } from "./visits/VisitCreate";
import { VisitDetail } from "./visits/VisitDetail";
import { VisitsList } from "./visits/VisitsList";

type VisitCreateIntent = {
  routeId?: string;
  customerId?: string;
};

type VisitPage =
  | { name: "list" }
  | { name: "create"; routeId?: string; customerId?: string }
  | { name: "detail"; visitId: string };

export function VisitsScreen({
  onOpenTab,
  initialCreateIntent,
  onInitialCreateIntentConsumed,
}: {
  onOpenTab: (tab: SellerTab) => void;
  initialCreateIntent?: VisitCreateIntent | null;
  onInitialCreateIntentConsumed?: () => void;
}) {
  const visits = useResource(sellerApi.visits, []);
  const customers = useResource(sellerApi.customers, []);
  const routes = useResource(sellerApi.todayRoutes, []);

  const [page, setPage] = useState<VisitPage>(() =>
    initialCreateIntent
      ? { name: "create", ...initialCreateIntent }
      : { name: "list" },
  );

  const visitList = visits.data || [];
  const customerList = customers.data || [];
  const routeList = routes.data || [];

  const activeVisit = useMemo(
    () => visitList.find((visit) => visit.status === "checked_in"),
    [visitList],
  );

  const selectedVisit = useMemo(() => {
    if (page.name !== "detail") return undefined;
    return visitList.find((visit) => visit._id === page.visitId);
  }, [page, visitList]);

  const isLoading = visits.loading || customers.loading || routes.loading;
  const combinedError = visits.error || customers.error || routes.error;

  const goList = useCallback(() => {
    setPage({ name: "list" });
  }, []);

  const goCreate = useCallback((intent?: VisitCreateIntent) => {
    if (activeVisit) {
      setPage({ name: "detail", visitId: activeVisit._id });
      return;
    }
    setPage({ name: "create", ...intent });
  }, [activeVisit]);

  const goDetail = useCallback((visit: Visit) => {
    setPage({ name: "detail", visitId: visit._id });
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([visits.reload(), customers.reload(), routes.reload()]);
  }, [customers.reload, routes.reload, visits.reload]);

  const reloadVisitsAndRoutes = useCallback(async () => {
    await Promise.all([visits.reload(), routes.reload()]);
  }, [routes.reload, visits.reload]);

  useRegisterRefresh(reloadAll, [reloadAll]);

  useEffect(() => {
    if (!initialCreateIntent) return;

    if (activeVisit) {
      setPage({ name: "detail", visitId: activeVisit._id });
    } else {
      setPage({ name: "create", ...initialCreateIntent });
    }
    onInitialCreateIntentConsumed?.();
  }, [activeVisit, initialCreateIntent, onInitialCreateIntentConsumed]);

  useEffect(() => {
    if (!isLoading && page.name === "create" && activeVisit) {
      setPage({ name: "detail", visitId: activeVisit._id });
    }
  }, [activeVisit, isLoading, page.name]);

  useEffect(() => {
    if (!isLoading && page.name === "detail" && !selectedVisit) {
      goList();
    }
  }, [goList, isLoading, page.name, selectedVisit]);

  const handleVisitCreated = useCallback(async () => {
    await reloadVisitsAndRoutes();
    goList();
  }, [goList, reloadVisitsAndRoutes]);

  const handleVisitChanged = useCallback(
    async (visit: Visit) => {
      await reloadVisitsAndRoutes();
      setPage({ name: "detail", visitId: visit._id });
    },
    [reloadVisitsAndRoutes],
  );

  if (isLoading) return <LoadingState variant="list" />;

  if (page.name === "create") {
    return (
      <VisitCreate
        customers={customerList}
        routes={routeList}
        initialCustomerId={page.customerId}
        initialRouteId={page.routeId}
        onBack={goList}
        onSaved={handleVisitCreated}
      />
    );
  }

  if (page.name === "detail") {
    if (!selectedVisit) return <LoadingState variant="list" />;

    return (
      <VisitDetail
        visit={selectedVisit}
        onBack={goList}
        onChanged={handleVisitChanged}
      />
    );
  }

  return (
    <VisitsList
      visits={visitList}
      routes={routeList}
      activeVisit={activeVisit}
      error={combinedError}
      onBack={() => onOpenTab("dashboard")}
      onCreate={goCreate}
      onDetail={goDetail}
    />
  );
}
