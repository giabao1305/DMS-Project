import DistributorLayout from "@/components/layout/DistributorLayout";
import AuthGuard from "@/components/layout/AuthGuard";
import SocketProvider from "@/components/providers/SocketProvider";

export default function DistributorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="distributor">
      <SocketProvider />
      <DistributorLayout>{children}</DistributorLayout>
    </AuthGuard>
  );
}
