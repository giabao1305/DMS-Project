import { useCallback, useEffect, useMemo, useState } from "react";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { LoadingState } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import type { Customer } from "../types/domain";
import { CustomerDetail } from "./customers/CustomerDetail";
import { CustomerForm } from "./customers/CustomerForm";
import { CustomersList } from "./customers/CustomersList";

type CustomerPage =
  | { name: "list" }
  | { name: "create" }
  | { name: "detail"; customerId: string }
  | { name: "edit"; customerId: string };

export function CustomersScreen({
  onCreateOrder,
  onCreateVisit,
  onOpenTab,
}: {
  onCreateOrder?: (customerId?: string) => void;
  onCreateVisit?: (intent: { customerId?: string }) => void;
  onOpenTab: (tab: SellerTab) => void;
}) {
  const { data, loading, error, reload } = useResource(sellerApi.customers, []);
  const orders = useResource(sellerApi.orders, []);
  const visits = useResource(sellerApi.visits, []);
  const [page, setPage] = useState<CustomerPage>({ name: "list" });
  const [message, setMessage] = useState("");
  const reloadAll = useCallback(async () => {
    await Promise.all([reload(), orders.reload(), visits.reload()]);
  }, [orders.reload, reload, visits.reload]);
  useRegisterRefresh(reloadAll, [reloadAll]);

  const customers = data || [];
  const selectedCustomer = useMemo(() => {
    if (!isCustomerScopedPage(page)) return undefined;
    return customers.find((customer) => customer._id === page.customerId);
  }, [customers, page]);

  useEffect(() => {
    if (!loading && isCustomerScopedPage(page) && !selectedCustomer)
      setPage({ name: "list" });
  }, [loading, page, selectedCustomer]);

  const goList = useCallback(() => setPage({ name: "list" }), []);
  const goCreate = useCallback(() => {
    setMessage("");
    setPage({ name: "create" });
  }, []);
  const goDetail = useCallback(
    (customer: Customer) =>
      setPage({ name: "detail", customerId: customer._id }),
    [],
  );
  const goEdit = useCallback((customer: Customer) => {
    setMessage("");
    setPage({ name: "edit", customerId: customer._id });
  }, []);
  const handleCustomerCreated = useCallback(async () => {
    await reload();
    setMessage("Đã tạo khách hàng.");
    goList();
  }, [goList, reload]);
  const handleCustomerUpdated = useCallback(
    async (customer: Customer) => {
      await reload();
      setMessage("Đã cập nhật khách hàng.");
      setPage({ name: "detail", customerId: customer._id });
    },
    [reload],
  );
  const handleCustomerDeleted = useCallback(async () => {
    await reload();
    setMessage("Đã xóa khách hàng.");
    goList();
  }, [goList, reload]);

  if (loading) return <LoadingState variant="list" />;

  if (page.name === "create")
    return (
      <CustomerForm
        title="Thêm khách hàng"
        onBack={goList}
        onSaved={handleCustomerCreated}
      />
    );
  if (page.name === "edit") {
    if (!selectedCustomer) return <LoadingState variant="list" />;
    return (
      <CustomerForm
        title="Sửa khách hàng"
        customer={selectedCustomer}
        onBack={() =>
          setPage({ name: "detail", customerId: selectedCustomer._id })
        }
        onSaved={handleCustomerUpdated}
      />
    );
  }
  if (page.name === "detail") {
    if (!selectedCustomer) return <LoadingState variant="list" />;
    return (
      <CustomerDetail
        customer={selectedCustomer}
        orders={orders.data || []}
        visits={visits.data || []}
        message={message}
        onBack={goList}
        onCreateOrder={() => onCreateOrder?.(selectedCustomer._id)}
        onCreateVisit={() =>
          onCreateVisit?.({ customerId: selectedCustomer._id })
        }
        onEdit={() => {
          if (selectedCustomer.status !== "approved") goEdit(selectedCustomer);
        }}
        onDeleted={handleCustomerDeleted}
      />
    );
  }

  return (
    <CustomersList
      customers={customers}
      error={error}
      message={message}
      onBack={() => onOpenTab("dashboard")}
      onCreate={goCreate}
      onDetail={goDetail}
      onEdit={goEdit}
    />
  );
}

function isCustomerScopedPage(
  page: CustomerPage,
): page is Extract<CustomerPage, { name: "detail" | "edit" }> {
  return page.name === "detail" || page.name === "edit";
}
