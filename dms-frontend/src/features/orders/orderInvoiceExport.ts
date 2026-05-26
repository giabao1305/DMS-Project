import type { Customer } from "@/features/customers/customerTypes";
import type { Order } from "@/features/orders/orderTypes";
import type { Promotion } from "@/features/promotions/promotionTypes";
import type { User } from "@/features/users/userTypes";

type InvoiceAmounts = {
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promotion?: Promotion;
};

type InvoiceExportOptions = {
  order: Order;
  amounts: InvoiceAmounts;
  sellerName?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  issuedBy?: string;
};

const COMPANY_NAME = "CÔNG TY DMS";
const COMPANY_ADDRESS = "Hệ thống quản lý phân phối";
const COMPANY_PHONE = "Hotline: 1900 0000";

const htmlEscape = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getSafeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const formatMoney = (value: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN");

const formatDateTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const DIGITS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

const readTriple = (value: number, readFull = false) => {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const unit = value % 10;
  const parts: string[] = [];

  if (hundred > 0 || readFull) {
    parts.push(`${DIGITS[hundred]} trăm`);
  }

  if (ten > 1) {
    parts.push(`${DIGITS[ten]} mươi`);
    if (unit === 1) parts.push("mốt");
    if (unit === 4) parts.push("tư");
    if (unit === 5) parts.push("lăm");
    if (![0, 1, 4, 5].includes(unit)) parts.push(DIGITS[unit]);
  } else if (ten === 1) {
    parts.push("mười");
    if (unit === 5) parts.push("lăm");
    if (unit > 0 && unit !== 5) parts.push(DIGITS[unit]);
  } else if (unit > 0) {
    if (hundred > 0 || readFull) parts.push("lẻ");
    parts.push(DIGITS[unit]);
  }

  return parts.join(" ");
};

const numberToVietnameseWords = (value: number) => {
  const rounded = Math.max(0, Math.round(value || 0));
  if (rounded === 0) return "Không đồng";

  const units = ["", "nghìn", "triệu", "tỷ"];
  const groups: number[] = [];
  let remaining = rounded;

  while (remaining > 0) {
    groups.unshift(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words = groups
    .map((group, index) => {
      if (group === 0) return "";
      const unitIndex = groups.length - index - 1;
      const readFull = index > 0 && group < 100;
      return `${readTriple(group, readFull)} ${units[unitIndex]}`.trim();
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");

  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng`;
};

const getCustomerInfo = (order: Order, options: InvoiceExportOptions) => {
  const customer =
    typeof order.customer === "string" ? undefined : (order.customer as Customer);

  return {
    name:
      options.customerName ||
      customer?.name ||
      (typeof order.customer === "string" ? order.customer : "-"),
    phone: options.customerPhone || customer?.phone || "-",
    address: options.customerAddress || customer?.address || "-",
  };
};

const getSellerName = (order: Order, options: InvoiceExportOptions) => {
  if (options.sellerName) return options.sellerName;
  if (typeof order.seller === "string") return order.seller;
  return (order.seller as User)?.fullName || "-";
};

const getProductUnit = (item: Order["items"][number]) => {
  if (typeof item.product === "string") return "";
  return item.product?.unit || "";
};

const buildInvoiceHtml = (options: InvoiceExportOptions) => {
  const { order, amounts } = options;
  const customer = getCustomerInfo(order, options);
  const sellerName = getSellerName(order, options);
  const invoiceDate = formatDateTime(order.deliveredAt || order.createdAt);
  const issuedAt = formatDateTime();

  const rows = order.items
    .map(
      (item, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${htmlEscape(item.productName)}</td>
          <td class="center">${htmlEscape(getProductUnit(item)) || "-"}</td>
          <td class="right">${formatNumber(item.quantity)}</td>
          <td class="right">${formatMoney(item.price)}</td>
          <td class="right strong">${formatMoney(item.subtotal)}</td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Hóa đơn ${htmlEscape(order.orderCode)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.45;
      background: #ffffff;
    }
    .invoice {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      padding: 4px;
      background: #ffffff;
    }
    .top {
      display: table;
      width: 100%;
      margin-bottom: 18px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
    }
    .company,
    .meta {
      display: table-cell;
      vertical-align: top;
      width: 50%;
    }
    .company h2 {
      margin: 0 0 5px;
      color: #0f172a;
      font-size: 22px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .company div,
    .meta div,
    .small {
      color: #4b5563;
      font-size: 12px;
    }
    .meta {
      text-align: right;
    }
    .meta strong {
      display: block;
      margin-bottom: 4px;
      color: #0f172a;
      font-size: 13px;
    }
    .title {
      margin: 8px 0 18px;
      text-align: center;
    }
    .title h1 {
      margin: 0;
      color: #0f172a;
      font-size: 24px;
      text-transform: uppercase;
    }
    .title p {
      margin: 4px 0 0;
      color: #4b5563;
      font-size: 12px;
    }
    .info {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border: 1px solid #d1d5db;
    }
    .box {
      display: table-cell;
      width: 50%;
      padding: 12px;
      vertical-align: top;
      border-right: 1px solid #d1d5db;
    }
    .box:last-child {
      border-right: 0;
    }
    .box h3 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 13px;
      text-transform: uppercase;
    }
    .line {
      margin: 4px 0;
    }
    .label {
      display: inline-block;
      min-width: 92px;
      color: #6b7280;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 9px 8px;
      border: 1px solid #d1d5db;
      vertical-align: top;
    }
    th {
      color: #111827;
      background: #f3f4f6;
      font-size: 12px;
      text-transform: uppercase;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .strong { font-weight: 700; }
    .totals {
      margin-top: 12px;
      margin-left: auto;
      width: 360px;
    }
    .totals td {
      padding: 8px 10px;
    }
    .totals .final td {
      color: #047857;
      font-size: 16px;
      font-weight: 800;
      background: #ecfdf5;
    }
    .note {
      margin-top: 14px;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      color: #374151;
      min-height: 44px;
    }
    .signatures {
      display: table;
      width: 100%;
      margin-top: 30px;
      text-align: center;
    }
    .signature {
      display: table-cell;
      width: 33.333%;
      padding-top: 4px;
      color: #111827;
      font-weight: 700;
    }
    .signature span {
      display: block;
      margin-top: 6px;
      color: #6b7280;
      font-size: 12px;
      font-style: italic;
      font-weight: 400;
    }
    .print-actions {
      position: fixed;
      top: 14px;
      right: 14px;
    }
    .print-actions button {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      background: #2563eb;
      cursor: pointer;
      font-weight: 700;
    }
    @media print {
      .print-actions { display: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()">In / Lưu PDF</button>
  </div>
  <main class="invoice">
    <section class="top">
      <div class="company">
        <h2>${htmlEscape(COMPANY_NAME)}</h2>
        <div>${htmlEscape(COMPANY_ADDRESS)}</div>
        <div>${htmlEscape(COMPANY_PHONE)}</div>
        <div>Mã số thuế: ................................</div>
      </div>
      <div class="meta">
        <strong>Số hóa đơn: ${htmlEscape(order.orderCode)}</strong>
        <div>Ngày hóa đơn: ${htmlEscape(invoiceDate)}</div>
        <div>Ngày xuất file: ${htmlEscape(issuedAt)}</div>
      </div>
    </section>

    <section class="title">
      <h1>Hóa đơn bán hàng</h1>
      <p>Thông tin đơn hàng, hàng hóa và tổng thanh toán</p>
    </section>

    <section class="info">
      <div class="box">
        <h3>Người mua hàng</h3>
        <div class="line"><span class="label">Khách hàng:</span> ${htmlEscape(customer.name)}</div>
        <div class="line"><span class="label">Điện thoại:</span> ${htmlEscape(customer.phone)}</div>
        <div class="line"><span class="label">Địa chỉ:</span> ${htmlEscape(customer.address)}</div>
      </div>
      <div class="box">
        <h3>Thông tin bán hàng</h3>
        <div class="line"><span class="label">Nhân viên:</span> ${htmlEscape(sellerName)}</div>
        <div class="line"><span class="label">Khuyến mãi:</span> ${htmlEscape(amounts.promotion?.name || "-")}</div>
        <div class="line"><span class="label">Thanh toán:</span> Tiền mặt / Chuyển khoản</div>
        <div class="line"><span class="label">Người xuất:</span> ${htmlEscape(options.issuedBy || "-")}</div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th style="width: 48px;">STT</th>
          <th>Tên hàng hóa, dịch vụ</th>
          <th style="width: 78px;">ĐVT</th>
          <th style="width: 86px;">SL</th>
          <th style="width: 130px;">Đơn giá</th>
          <th style="width: 140px;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="totals">
      <tbody>
        <tr>
          <td>Tổng tiền hàng</td>
          <td class="right strong">${formatMoney(amounts.totalAmount)}</td>
        </tr>
        <tr>
          <td>Giảm giá</td>
          <td class="right strong">${formatMoney(amounts.discountAmount)}</td>
        </tr>
        <tr class="final">
          <td>Thanh toán</td>
          <td class="right">${formatMoney(amounts.finalAmount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="note">
      <div><strong>Số tiền viết bằng chữ:</strong> ${htmlEscape(numberToVietnameseWords(amounts.finalAmount))}.</div>
      <strong>Ghi chú:</strong> ${htmlEscape(order.note || "-")}
    </div>

    <section class="signatures">
      <div class="signature">Người lập hóa đơn<span>Ký, ghi rõ họ tên</span></div>
      <div class="signature">Người giao hàng<span>Ký, ghi rõ họ tên</span></div>
      <div class="signature">Khách hàng<span>Ký, ghi rõ họ tên</span></div>
    </section>
  </main>
</body>
</html>`;
};

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export function exportOrderInvoiceExcel(options: InvoiceExportOptions) {
  const safeOrderCode = getSafeName(options.order.orderCode) || "hoa-don";
  downloadFile(
    `hoa-don-${safeOrderCode}.xls`,
    `\uFEFF${buildInvoiceHtml(options)}`,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

export function exportOrderInvoicePdf(options: InvoiceExportOptions) {
  const printWindow = window.open("", "_blank", "width=960,height=720");
  if (!printWindow) {
    throw new Error("POPUP_BLOCKED");
  }

  printWindow.document.open();
  printWindow.document.write(buildInvoiceHtml(options));
  printWindow.document.close();
  printWindow.focus();

  window.setTimeout(() => {
    printWindow.print();
  }, 300);
}
