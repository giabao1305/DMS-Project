import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });
  } else {
    socket.auth = {
      token,
    };
  }

  return socket;
};
