import SellerLayout from "@/components/layout/SellerLayout";
import AuthGuard from "@/components/layout/AuthGuard";
import SocketProvider from "@/components/providers/SocketProvider";
export default function SellerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="seller">
      <SocketProvider />
      <SellerLayout>{children}</SellerLayout>
    </AuthGuard>
  );
}
