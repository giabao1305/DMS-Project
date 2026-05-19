const escapeCsvValue = (value: string | number | undefined | null) => {
  const text = value === undefined || value === null ? "" : String(value);

  return `"${text.replace(/"/g, '""')}"`;
};

export function exportCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | undefined | null>>,
) {
  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
