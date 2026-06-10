import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/features/auth/authSlice";
import { authService } from "@/features/auth/authService";
import { userService } from "@/features/users/userService";
import { customerService } from "@/features/customers/customerService";
import { categoryService } from "@/features/categories/categoryService";
import { productService } from "@/features/products/productService";
import { orderService } from "@/features/orders/orderService";

import { routeService } from "@/features/routes/routeService";
import { visitService } from "@/features/visits/visitService";
import { leaveService } from "@/features/leaves/leaveService";

import { notificationService } from "@/features/notifications/notificationService";

import { reportService } from "@/features/reports/reportService";
import { promotionService } from "@/features/promotions/promotionService";
import { inventoryService } from "@/features/inventory/inventoryService";
import { auditService } from "@/features/audit/auditService";
import { dashboardService } from "@/features/dashboard/dashboardService";
import { warehouseService } from "@/features/warehouses/warehouseService";

export const store = configureStore({
  reducer: {
    auth: authReducer,

    [authService.reducerPath]: authService.reducer,
    [userService.reducerPath]: userService.reducer,
    [customerService.reducerPath]: customerService.reducer,
    [categoryService.reducerPath]: categoryService.reducer,
    [productService.reducerPath]: productService.reducer,
    [orderService.reducerPath]: orderService.reducer,
    [routeService.reducerPath]: routeService.reducer,
    [visitService.reducerPath]: visitService.reducer,
    [leaveService.reducerPath]: leaveService.reducer,
    [notificationService.reducerPath]: notificationService.reducer,
    [reportService.reducerPath]: reportService.reducer,
    [promotionService.reducerPath]: promotionService.reducer,
    [inventoryService.reducerPath]: inventoryService.reducer,
    [auditService.reducerPath]: auditService.reducer,
    [dashboardService.reducerPath]: dashboardService.reducer,
    [warehouseService.reducerPath]: warehouseService.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authService.middleware,
      userService.middleware,
      customerService.middleware,
      categoryService.middleware,
      productService.middleware,
      orderService.middleware,
      routeService.middleware,
      visitService.middleware,
      leaveService.middleware,
      notificationService.middleware,
      reportService.middleware,
      promotionService.middleware,
      inventoryService.middleware,
      auditService.middleware,
      dashboardService.middleware,
      warehouseService.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
