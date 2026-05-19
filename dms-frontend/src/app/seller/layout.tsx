import SellerLayout from "@/components/layout/SellerLayout";
import AuthGuard from "@/components/layout/AuthGuard";
import SocketProvider from "@/components/providers/SocketProvider";
import { salesPortalRoles } from "@/features/auth/roleUtils";

export default function SellerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={salesPortalRoles}>
      <SocketProvider />
      <SellerLayout>{children}</SellerLayout>
    </AuthGuard>
  );
}
