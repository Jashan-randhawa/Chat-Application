import { createContext, useContext, useMemo, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { server } from "@/config/constants";
import { getToken } from "@/lib/token";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = (): Socket | null => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socket = useMemo(() => {
    const token = getToken();
    return io(server, {
      withCredentials: true,
      // Send token in handshake so socket auth works cross-site
      auth: token ? { token } : {},
    });
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
