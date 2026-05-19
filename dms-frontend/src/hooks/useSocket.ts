"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

type UseSocketParams = {
  userId?: string;
  role?: string;
};

export function useSocket({ userId, role }: UseSocketParams) {
  useEffect(() => {
    if (!userId && !role) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      if (userId) {
        socket.emit("join-user", userId);
      }

      if (role) {
        socket.emit("join-role", role);
      }
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [userId, role]);
}
