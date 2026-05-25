"use client";

import { useEffect } from "react";
import { getSocket, resetSocket } from "@/lib/socket";

type UseSocketParams = {
  userId?: string;
  role?: string;
};

export function useSocket({ userId, role }: UseSocketParams) {
  useEffect(() => {
    if (!userId && !role) return;

    resetSocket();
    const socket = getSocket();

    const handleConnect = () => {
      if (userId) {
        socket.emit("join-user", userId);
      }

      if (role) {
        socket.emit("join-role", role);
      }
    };

    socket.on("connect", handleConnect);
    socket.connect();

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [userId, role]);
}
