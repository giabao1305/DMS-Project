"use client";

import { useEffect } from "react";

import { hydrateAuth } from "@/features/auth/authSlice";
import { useAppDispatch } from "@/store/hooks";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return children;
}
