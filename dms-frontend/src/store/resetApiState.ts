import type { AppDispatch } from "@/store/store";

import { auditService } from "@/features/audit/auditService";
import { authService } from "@/features/auth/authService";
import { categoryService } from "@/features/categories/categoryService";
import { customerService } from "@/features/customers/customerService";
import { dashboardService } from "@/features/dashboard/dashboardService";
import { inventoryService } from "@/features/inventory/inventoryService";
import { leaveService } from "@/features/leaves/leaveService";
import { notificationService } from "@/features/notifications/notificationService";
import { orderService } from "@/features/orders/orderService";
import { productService } from "@/features/products/productService";
import { promotionService } from "@/features/promotions/promotionService";
import { reportService } from "@/features/reports/reportService";
import { routeService } from "@/features/routes/routeService";
import { userService } from "@/features/users/userService";
import { visitService } from "@/features/visits/visitService";

const apiServices = [
  authService,
  userService,
  customerService,
  categoryService,
  productService,
  orderService,
  routeService,
  visitService,
  leaveService,
  notificationService,
  reportService,
  promotionService,
  inventoryService,
  auditService,
  dashboardService,
] as const;

export function resetApiState(dispatch: AppDispatch) {
  apiServices.forEach((service) => {
    dispatch(service.util.resetApiState());
  });
}
