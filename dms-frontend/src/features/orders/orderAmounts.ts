import type { Order } from "./orderTypes";
import type { Promotion } from "@/features/promotions/promotionTypes";

const safeAmount = (value: number | undefined) =>
  Number.isFinite(value) ? Number(value) : 0;

const calculatePromotionDiscount = (
  promotion: Promotion | undefined,
  totalAmount: number,
) => {
  if (!promotion || totalAmount < (promotion.minOrderValue || 0)) return 0;

  if (promotion.type === "percent") {
    return (totalAmount * (promotion.discountPercent || 0)) / 100;
  }

  if (promotion.type === "amount") {
    return promotion.discountAmount || 0;
  }

  return 0;
};

export function getOrderAmounts(
  order: Order,
  resolvedPromotion?: Promotion,
) {
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + safeAmount(item.subtotal),
    0,
  );
  const totalAmount = itemsTotal || safeAmount(order.totalAmount);
  const promotion =
    resolvedPromotion ||
    (order.promotion && typeof order.promotion !== "string"
      ? (order.promotion as Promotion)
      : undefined);
  const storedDiscount = safeAmount(order.discountAmount);
  const discountAmount = Math.min(
    totalAmount,
    storedDiscount || calculatePromotionDiscount(promotion, totalAmount),
  );

  return {
    totalAmount,
    discountAmount,
    finalAmount: Math.max(0, totalAmount - discountAmount),
    promotion,
  };
}
