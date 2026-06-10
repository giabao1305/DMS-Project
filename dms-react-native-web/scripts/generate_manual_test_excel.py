from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "manual-test-checklist.md"
OUTPUT = ROOT / "docs" / "manual-test-checklist.xlsx"


def col_name(index: int) -> str:
    name = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def cell_ref(row: int, col: int) -> str:
    return f"{col_name(col)}{row}"


def text_cell(row: int, col: int, value: str, style: int = 0) -> str:
    escaped = html.escape(value or "")
    return (
        f'<c r="{cell_ref(row, col)}" t="inlineStr" s="{style}">'
        f"<is><t>{escaped}</t></is></c>"
    )


def number_cell(row: int, col: int, value: int | float, style: int = 0) -> str:
    return f'<c r="{cell_ref(row, col)}" s="{style}"><v>{value}</v></c>'


def formula_cell(row: int, col: int, formula: str, style: int = 0) -> str:
    return f'<c r="{cell_ref(row, col)}" s="{style}"><f>{formula}</f></c>'


def row_xml(row: int, cells: list[str], height: int | None = None) -> str:
    attrs = f' r="{row}"'
    if height:
        attrs += f' ht="{height}" customHeight="1"'
    return f"<row{attrs}>{''.join(cells)}</row>"


def parse_markdown() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    h2 = ""
    h3 = ""
    h4 = ""
    order = 1

    for raw_line in SOURCE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("## "):
            h2 = line.removeprefix("## ").strip()
            h3 = ""
            h4 = ""
            continue
        if line.startswith("### "):
            h3 = line.removeprefix("### ").strip()
            h4 = ""
            continue
        if line.startswith("#### "):
            h4 = line.removeprefix("#### ").strip()
            continue

        match = re.match(r"^- \[[ xX]\]\s+(.*)$", line)
        if not match:
            continue

        step = match.group(1).strip()
        rows.append(
            {
                "No": str(order),
                "Area": h2,
                "Section/Page": h3 or h4 or h2,
                "Subsection": h4,
                "Test Step": step,
                "Expected Result": "Hoat dong dung nhu mo ta, dung role/scope, khong loi UI/API.",
                "Status": "Not Run",
                "Tester": "",
                "Test Date": "",
                "Evidence/Notes": "",
            }
        )
        order += 1

    return rows


def worksheet_xml(rows: list[dict[str, str]]) -> str:
    headers = [
        "No",
        "Area",
        "Section/Page",
        "Subsection",
        "Test Step",
        "Expected Result",
        "Status",
        "Tester",
        "Test Date",
        "Evidence/Notes",
    ]
    widths = [7, 28, 32, 28, 72, 54, 14, 18, 16, 48]

    sheet_rows: list[str] = []
    sheet_rows.append(
        row_xml(
            1,
            [text_cell(1, index + 1, header, 1) for index, header in enumerate(headers)],
            height=24,
        )
    )

    for row_index, item in enumerate(rows, start=2):
        status_style = 4
        cells = []
        for col_index, header in enumerate(headers, start=1):
            value = item[header]
            if header == "No":
                cells.append(number_cell(row_index, col_index, int(value), 2))
            elif header == "Status":
                cells.append(text_cell(row_index, col_index, value, status_style))
            else:
                cells.append(text_cell(row_index, col_index, value, 2))
        sheet_rows.append(row_xml(row_index, cells, height=44))

    dimension = f"A1:{cell_ref(len(rows) + 1, len(headers))}"
    cols = "".join(
        f'<col min="{i}" max="{i}" width="{width}" customWidth="1"/>'
        for i, width in enumerate(widths, start=1)
    )
    validations_range = f"G2:G{len(rows) + 1}"

    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="{dimension}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>{cols}</cols>
  <sheetData>{''.join(sheet_rows)}</sheetData>
  <autoFilter ref="{dimension}"/>
  <dataValidations count="1">
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="{validations_range}">
      <formula1>"Not Run,Pass,Fail,Blocked,Retest"</formula1>
    </dataValidation>
  </dataValidations>
  <conditionalFormatting sqref="{validations_range}">
    <cfRule type="containsText" priority="1" operator="containsText" text="Pass">
      <formula>NOT(ISERROR(SEARCH("Pass",G2)))</formula>
      <dxfId>0</dxfId>
    </cfRule>
    <cfRule type="containsText" priority="2" operator="containsText" text="Fail">
      <formula>NOT(ISERROR(SEARCH("Fail",G2)))</formula>
      <dxfId>1</dxfId>
    </cfRule>
    <cfRule type="containsText" priority="3" operator="containsText" text="Blocked">
      <formula>NOT(ISERROR(SEARCH("Blocked",G2)))</formula>
      <dxfId>2</dxfId>
    </cfRule>
  </conditionalFormatting>
</worksheet>'''


def summary_xml(total_rows: int) -> str:
    entries = [
        ("Total", f"COUNTA(Checklist!A2:A{total_rows + 1})"),
        ("Not Run", f'COUNTIF(Checklist!G2:G{total_rows + 1},"Not Run")'),
        ("Pass", f'COUNTIF(Checklist!G2:G{total_rows + 1},"Pass")'),
        ("Fail", f'COUNTIF(Checklist!G2:G{total_rows + 1},"Fail")'),
        ("Blocked", f'COUNTIF(Checklist!G2:G{total_rows + 1},"Blocked")'),
        ("Retest", f'COUNTIF(Checklist!G2:G{total_rows + 1},"Retest")'),
    ]

    rows = [
        row_xml(1, [text_cell(1, 1, "Metric", 1), text_cell(1, 2, "Count", 1)], height=24)
    ]
    for row_index, (label, formula) in enumerate(entries, start=2):
        rows.append(
            row_xml(
                row_index,
                [text_cell(row_index, 1, label, 2), formula_cell(row_index, 2, formula, 2)],
                height=22,
            )
        )

    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:B{len(entries) + 1}"/>
  <cols>
    <col min="1" max="1" width="24" customWidth="1"/>
    <col min="2" max="2" width="14" customWidth="1"/>
  </cols>
  <sheetData>{''.join(rows)}</sheetData>
</worksheet>'''


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor rgb="FF1F4E79"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor rgb="FFF8FAFC"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor rgb="FFEFF6FF"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFill="1" applyBorder="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFill="1" applyBorder="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="3">
    <dxf><fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill></dxf>
    <dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill></dxf>
    <dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill></dxf>
  </dxfs>
</styleSheet>'''


def write_xlsx(rows: list[dict[str, str]]) -> None:
    files = {
        "[Content_Types].xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>''',
        "_rels/.rels": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>''',
        "xl/workbook.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Checklist" sheetId="1" r:id="rId1"/>
    <sheet name="Summary" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>''',
        "xl/_rels/workbook.xml.rels": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>''',
        "xl/worksheets/sheet1.xml": worksheet_xml(rows),
        "xl/worksheets/sheet2.xml": summary_xml(len(rows)),
        "xl/styles.xml": styles_xml(),
        "docProps/core.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>DMS Manual Test Checklist</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-03T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-03T00:00:00Z</dcterms:modified>
</cp:coreProperties>''',
        "docProps/app.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>''',
    }

    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)


def main() -> None:
    rows = parse_markdown()
    if not rows:
        raise SystemExit("No checklist rows found")
    write_xlsx(rows)
    print(f"Wrote {OUTPUT} with {len(rows)} checklist rows")


if __name__ == "__main__":
    main()
