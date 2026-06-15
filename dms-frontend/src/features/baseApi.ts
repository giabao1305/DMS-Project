import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { logout, setCredentials } from "@/features/auth/authSlice";
import type { RefreshTokenResponse } from "@/features/auth/authTypes";
import { translateApiMessage } from "@/features/orders/orderErrorMessage";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",

  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return headers;
  },
});

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  translateErrorResult(result);

  if (result.error?.status === 401 && !isAuthRecoveryRequest(args)) {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const credentials = refreshResult.data as RefreshTokenResponse;

        api.dispatch(
          setCredentials({
            user: credentials.user,
            token: credentials.accessToken,
            refreshToken: credentials.refreshToken,
          }),
        );

        const retryResult = await rawBaseQuery(args, api, extraOptions);
        translateErrorResult(retryResult);
        return retryResult;
      }
    }

    api.dispatch(logout());

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/auth/login"
    ) {
      window.location.replace("/auth/login");
    }
  }

  return result;
};

function translateErrorResult(
  result: Awaited<ReturnType<typeof rawBaseQuery>>,
) {
  const data = result.error?.data as
    | { message?: string | string[] }
    | undefined;
  if (!data) return;

  const detail = data?.message;

  if (typeof detail === "string") {
    data.message = translateApiMessage(detail) || detail;
    return;
  }

  if (Array.isArray(detail)) {
    data.message = detail.map((item) => translateApiMessage(item) || item);
  }
}

function isAuthRecoveryRequest(args: string | FetchArgs) {
  const url = typeof args === "string" ? args : args.url;

  return url === "/auth/login" || url === "/auth/refresh";
}
