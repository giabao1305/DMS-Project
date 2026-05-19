"use client";

import AccountSettingsPage from "@/components/account/AccountSettingsPage";
import AdminBreadcrumb from "@/components/ui/AdminBreadcrumb";
import AdminPageHeader from "@/components/ui/AdminPageHeader";

export default function AdminProfilePage() {
  return (
    <>
      <AdminBreadcrumb />
      <AdminPageHeader
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin tài khoản và đổi mật khẩu đăng nhập."
      />
      <AccountSettingsPage accent="admin" />
    </>
  );
}
