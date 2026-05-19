"use client";

import { useEffect, useMemo, useState } from "react";

import { getSocket } from "@/lib/socket";

export function useRealtimeHighlight(
  events: readonly string[],
  getId: (payload: unknown) => string | undefined,
  duration = 3000,
) {
  const [highlightedId, setHighlightedId] = useState<string>();
  const eventsKey = useMemo(() => events.join("|"), [events]);
  const eventList = useMemo(
    () => eventsKey.split("|").filter(Boolean),
    [eventsKey],
  );

  useEffect(() => {
    if (!eventList.length) return;

    const socket = getSocket();

    const handleRealtimeEvent = (payload: unknown) => {
      const id = getId(payload);

      if (!id) return;

      setHighlightedId(id);

      window.setTimeout(() => {
        setHighlightedId((currentId) => (currentId === id ? undefined : currentId));
      }, duration);
    };

    eventList.forEach((event) => {
      socket.on(event, handleRealtimeEvent);
    });

    return () => {
      eventList.forEach((event) => {
        socket.off(event, handleRealtimeEvent);
      });
    };
  }, [duration, eventList, getId]);

  return highlightedId;
}
