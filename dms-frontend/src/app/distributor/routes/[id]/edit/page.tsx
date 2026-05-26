"use client";

import { useParams } from "next/navigation";

import RouteFormPage from "@/app/admin/routes/RouteFormPage";

export default function DistributorEditRoutePage() {
  const params = useParams<{ id: string }>();

  return <RouteFormPage mode="edit" routeId={params.id} scope="distributor" />;
}
