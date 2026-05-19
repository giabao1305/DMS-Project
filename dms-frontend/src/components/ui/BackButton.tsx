// src/components/ui/BackButton.tsx

"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";

type Props = {
  text?: string;
};

export default function BackButton({ text = "Quay lại" }: Props) {
  const router = useRouter();

  return (
    <Button
      icon={<ArrowLeftOutlined />}
      onClick={() => router.back()}
      style={{
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {text}
    </Button>
  );
}
