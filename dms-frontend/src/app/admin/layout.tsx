import AdminLayout from "@/components/layout/AdminLayout";
import AuthGuard from "@/components/layout/AuthGuard";
import SocketProvider from "@/components/providers/SocketProvider";
import { App } from "antd";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <App>
        <SocketProvider />
        <AdminLayout>{children}</AdminLayout>
      </App>
    </AuthGuard>
  );
}
