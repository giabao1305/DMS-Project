import AdminLayout from "@/components/layout/AdminLayout";
import AuthGuard from "@/components/layout/AuthGuard";
import SocketProvider from "@/components/providers/SocketProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <SocketProvider />
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
