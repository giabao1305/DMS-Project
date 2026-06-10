import { useState } from "react";

import { useEffect } from "react";

import { sellerApi } from "../api/sellerApi";
import type { SellerTab } from "../components/AppShell";
import { LoadingState } from "../components/Ui";
import { useRegisterRefresh } from "../hooks/RefreshContext";
import { useResource } from "../hooks/useResource";
import type { Order } from "../types/domain";
import { OrderDetail } from "./orders/OrderDetail";
import { OrderForm } from "./orders/OrderForm";
import { OrdersList } from "./orders/OrdersList";

type OrderPage =
  | { name: "list" }
  | { name: "create" }
  | { name: "detail"; order: Order }
  | { name: "edit"; order: Order };

export function OrdersScreen({
  initialCustomerId,
  onInitialCustomerConsumed,
  paymentReturnOrderId,
  onPaymentReturnConsumed,
  onOpenTab,
}: {
  initialCustomerId?: string | null;
  onInitialCustomerConsumed?: () => void;
  paymentReturnOrderId?: string | null;
  onPaymentReturnConsumed?: () => void;
  onOpenTab: (tab: SellerTab) => void;
}) {
  const orders = useResource(sellerApi.orders, []);
  const customers = useResource(sellerApi.customers, []);
  const products = useResource(sellerApi.saleProducts, []);
  const promotions = useResource(sellerApi.activePromotions, []);
  const visits = useResource(sellerApi.visits, []);
  const [page, setPage] = useState<OrderPage>({ name: "list" });
  const [message, setMessage] = useState("");
  const [createCustomerId, setCreateCustomerId] = useState(initialCustomerId || "");
  const activeVisit = (visits.data || []).find((visit) => visit.status === "checked_in");

  useEffect(() => {
    if (!initialCustomerId) return;
    setCreateCustomerId(initialCustomerId);
    setMessage("");
    setPage({ name: "create" });
    onInitialCustomerConsumed?.();
  }, [initialCustomerId, onInitialCustomerConsumed]);

  useEffect(() => {
    if (!paymentReturnOrderId) return;

    let isMounted = true;

    const openReturnedOrder = async () => {
      try {
        const order = await sellerApi.order(paymentReturnOrderId);
        if (!isMounted) return;
        await orders.reload();
        setMessage("Thanh toán VNPay thành công. Đã cập nhật đơn hàng.");
        setPage({ name: "detail", order });
      } catch {
        if (!isMounted) return;
        setMessage("Thanh toán đã xử lý, vui lòng tải lại danh sách đơn.");
        setPage({ name: "list" });
      } finally {
        onPaymentReturnConsumed?.();
      }
    };

    void openReturnedOrder();

    return () => {
      isMounted = false;
    };
  }, [onPaymentReturnConsumed, orders, paymentReturnOrderId]);

  useRegisterRefresh(async () => {
    await orders.reload();
    await customers.reload();
    await products.reload();
    await promotions.reload();
    await visits.reload();
  }, [orders.reload, customers.reload, products.reload, promotions.reload, visits.reload]);

  if (orders.loading || customers.loading || products.loading || promotions.loading || visits.loading) {
    return <LoadingState variant="list" />;
  }

  const refresh = async () => {
    await orders.reload();
  };

  if (page.name === "create") {
    return (
      <OrderForm
        title="Tạo đơn hàng"
        customers={customers.data || []}
        products={products.data || []}
        promotions={promotions.data || []}
        initialCustomerId={createCustomerId || undefined}
        activeVisit={activeVisit}
        onCheckIn={() => onOpenTab("visits")}
        onBack={() => setPage({ name: "list" })}
        onSaved={async () => {
          await refresh();
          setMessage("Đã tạo đơn hàng.");
          setPage({ name: "list" });
        }}
      />
    );
  }

  if (page.name === "edit") {
    return (
      <OrderForm
        title="Sửa đơn hàng"
        order={page.order}
        customers={customers.data || []}
        products={products.data || []}
        promotions={promotions.data || []}
        onBack={() => setPage({ name: "detail", order: page.order })}
        onSaved={async (order) => {
          await refresh();
          setMessage("Đã cập nhật đơn hàng.");
          setPage({ name: "detail", order });
        }}
      />
    );
  }

  if (page.name === "detail") {
    return (
      <OrderDetail
        order={page.order}
        onBack={() => setPage({ name: "list" })}
        onEdit={() => setPage({ name: "edit", order: page.order })}
        onChanged={async (order) => {
          await refresh();
          setPage({ name: "detail", order });
        }}
      />
    );
  }

  return (
    <OrdersList
      orders={orders.data || []}
      error={orders.error || customers.error || products.error || promotions.error || visits.error}
      message={message}
      onBack={() => onOpenTab("dashboard")}
      onCreate={() => { setCreateCustomerId(""); setMessage(""); setPage({ name: "create" }); }}
      onCheckIn={() => onOpenTab("visits")}
      canCreate={Boolean(activeVisit)}
      onDetail={(order) => setPage({ name: "detail", order })}
      onEdit={(order) => setPage({ name: "edit", order })}
    />
  );
}
