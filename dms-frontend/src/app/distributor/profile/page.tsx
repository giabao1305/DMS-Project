import AccountSettingsPage from "@/components/account/AccountSettingsPage";
import { DistributorPageShell } from "@/components/distributor/DistributorPageShell";

export default function DistributorProfilePage() {
  return (
    <DistributorPageShell
      eyebrow="Tài khoản"
      title="Hồ sơ nhà phân phối"
      description="Cập nhật thông tin tài khoản, thông tin công ty và bảo mật đăng nhập."
    >
      <AccountSettingsPage accent="distributor" />
    </DistributorPageShell>
  );
}
