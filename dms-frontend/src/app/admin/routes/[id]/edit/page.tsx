"use client";

import { useParams } from "next/navigation";

import RouteFormPage from "@/app/admin/routes/RouteFormPage";

export default function EditRoutePage() {
  const params = useParams<{ id: string }>();

  return <RouteFormPage mode="edit" routeId={params.id} />;
}
