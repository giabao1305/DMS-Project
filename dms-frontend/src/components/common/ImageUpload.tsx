"use client";

import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Image, Upload } from "antd";
import type { UploadProps } from "antd";

type ImageUploadProps = {
  value?: string;
  onChange?: (value: string) => void;
  actionPath?: "/upload/image" | "/upload/avatar";
  alt?: string;
  label?: string;
  size?: number;
  variant?: "card" | "button";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ImageUpload({
  value,
  onChange,
  actionPath = "/upload/image",
  alt = "Ảnh",
  label = "Upload",
  size = 100,
  variant = "card",
}: ImageUploadProps) {
  const { message } = App.useApp();

  const uploadProps: UploadProps = {
    name: "file",
    action: `${API_URL}${actionPath}`,
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

  if (variant === "button") {
    return (
      <Upload {...uploadProps} listType="text">
        <Button icon={<PlusOutlined />}>{label}</Button>
      </Upload>
    );
  }

  return (
    <Upload {...uploadProps}>
      {value ? (
        <Image
          src={value}
          alt={alt}
          width={size}
          height={size}
          preview={false}
          style={{
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>{label}</div>
        </div>
      )}
    </Upload>
  );
}
