"use client";

import { useEffect, useMemo, useRef } from "react";

import { getSocket } from "@/lib/socket";

export function useRealtimeRefetch(
  events: readonly string[],
  refetch: () => unknown,
) {
  const refetchRef = useRef(refetch);
  const eventsKey = useMemo(() => events.join("|"), [events]);
  const eventList = useMemo(
    () => eventsKey.split("|").filter(Boolean),
    [eventsKey],
  );

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    if (!eventList.length) return;

    const socket = getSocket();

    const handleRefresh = () => {
      refetchRef.current();
    };

    eventList.forEach((event) => {
      socket.on(event, handleRefresh);
    });

    return () => {
      eventList.forEach((event) => {
        socket.off(event, handleRefresh);
      });
    };
  }, [eventList]);
}
