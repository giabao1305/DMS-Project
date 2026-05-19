"use client";

import AccountSettingsPage from "@/components/account/AccountSettingsPage";
import SellerBreadcrumb from "@/components/ui/SellerBreadcrumb";
import SellerPageHeader from "@/components/ui/SellerPageHeader";

export default function SellerProfilePage() {
  return (
    <>
      <SellerBreadcrumb />
      <SellerPageHeader
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin tài khoản và đổi mật khẩu đăng nhập."
      />
      <AccountSettingsPage accent="seller" />
    </>
  );
}
