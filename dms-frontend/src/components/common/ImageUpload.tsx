"use client";

import { PlusOutlined } from "@ant-design/icons";
import { App, Image, Upload } from "antd";
import type { UploadProps } from "antd";

type ImageUploadProps = {
  value?: string;
  onChange?: (value: string) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const { message } = App.useApp();

  const uploadProps: UploadProps = {
    name: "file",
    action: `${API_URL}/upload/image`,
    headers:
      typeof window !== "undefined" && localStorage.getItem("token")
        ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
        : undefined,
    listType: "picture-card",
    maxCount: 1,
    accept: "image/*",
    showUploadList: false,

    onChange(info) {
      if (info.file.status === "done") {
        const imageUrl = info.file.response?.imageUrl;

        if (imageUrl) {
          onChange?.(imageUrl);
          message.success("Upload ảnh thành công");
        }
      }

      if (info.file.status === "error") {
        message.error("Upload ảnh thất bại");
      }
    },
  };

  return (
    <Upload {...uploadProps}>
      {value ? (
        <Image
          src={value}
          alt="Ảnh sản phẩm"
          width={100}
          height={100}
          preview={false}
          style={{
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </Upload>
  );
}
