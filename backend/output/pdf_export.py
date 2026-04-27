import os
import uuid
import asyncio
from datetime import datetime

import markdown
from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CSS = """
body {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  font-size: 10.5pt;
  line-height: 1.8;
  color: #1f2937;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Cover ── */
.cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 920px;
  text-align: center;
  page-break-after: always;
}
.cover-brand {
  width: 80px; height: 80px;
  border-radius: 18px;
  background: linear-gradient(135deg, #059669, #10b981);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 36px;
  box-shadow: 0 8px 32px rgba(5,150,105,0.25);
}
.cover-brand span {
  color: white; font-size: 36pt; font-weight: 700;
}
.cover h1 {
  font-size: 28pt; font-weight: 700; color: #065f46;
  margin: 0 0 12px; letter-spacing: 3px;
  border: none; padding: 0;
}
.cover-subtitle {
  font-size: 13pt; color: #6b7280; margin-bottom: 56px;
  letter-spacing: 4px;
}
.cover-line {
  width: 100px; height: 2px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
  margin: 0 auto 40px; border: none;
}
.cover-meta {
  font-size: 9.5pt; color: #9ca3af; line-height: 2.4;
}

/* ── Headings ── */
h1 {
  font-size: 18pt; font-weight: 700; color: #065f46;
  border-bottom: 2.5px solid #10b981; padding-bottom: 8px;
  margin: 36px 0 16px;
  page-break-after: avoid;
}
h2 {
  font-size: 14pt; font-weight: 700; color: #047857;
  margin: 28px 0 12px; padding-left: 12px;
  border-left: 4px solid #34d399;
  page-break-after: avoid;
}
h3 {
  font-size: 12pt; font-weight: 600; color: #374151;
  margin: 20px 0 8px;
  page-break-after: avoid;
}
h4 {
  font-size: 11pt; font-weight: 600; color: #4b5563;
  margin: 16px 0 6px;
}

/* ── Paragraph & Lists ── */
p { margin: 0 0 10px; text-align: justify; orphans: 3; widows: 3; }
ul, ol { padding-left: 24px; margin-bottom: 12px; }
li { margin-bottom: 4px; }
li > strong { color: #065f46; }

/* ── Tables ── */
table {
  width: 100%; border-collapse: collapse;
  margin: 14px 0 18px; font-size: 9.5pt;
  page-break-inside: auto;
}
thead { display: table-header-group; }
thead tr {
  background: linear-gradient(135deg, #065f46, #047857);
}
thead th {
  color: white; font-weight: 600; padding: 8px 10px;
  text-align: left; border: 1px solid #047857;
  white-space: nowrap;
}
tbody tr { page-break-inside: avoid; }
tbody tr:nth-child(even) { background-color: #f0fdf4; }
td {
  padding: 7px 10px; border: 1px solid #d1d5db;
  vertical-align: top;
}

/* ── Code ── */
code {
  font-family: Consolas, "Source Code Pro", monospace;
  font-size: 9pt; background: #f3f4f6;
  padding: 1px 5px; border-radius: 3px; color: #b91c1c;
}
pre {
  background: #1f2937; color: #e5e7eb; padding: 14px;
  border-radius: 6px; font-size: 9pt;
  page-break-inside: avoid; overflow-x: auto;
}
pre code { background: none; color: inherit; padding: 0; }

/* ── Blockquote ── */
blockquote {
  border-left: 4px solid #10b981; margin: 12px 0;
  padding: 8px 16px; background: #f0fdf4; color: #374151;
}

/* ── HR ── */
hr { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }

/* ── Strong ── */
strong { color: #065f46; }

/* ── Page Footer (via running header) ── */
.page-footer {
  position: fixed; bottom: 0; left: 0; right: 0;
  text-align: center; font-size: 8pt; color: #9ca3af;
  padding: 8px 0; border-top: 1px solid #e5e7eb;
}
"""


def _build_cover_html(title: str = "产品研发报告") -> str:
    now = datetime.now().strftime("%Y年%m月%d日")
    return f"""
    <div class="cover">
      <div class="cover-brand"><span>寿</span></div>
      <h1>{title}</h1>
      <div class="cover-subtitle">AI 驱动 · 古今融合 · 智能研发</div>
      <div class="cover-line"></div>
      <div class="cover-meta">
        智能产品研发系统自动生成<br>
        {now}
      </div>
    </div>
    """


def _extract_title(md_text: str) -> str:
    for line in md_text.split("\n"):
        stripped = line.strip()
        if stripped.startswith("# ") and not stripped.startswith("## "):
            return stripped[2:].strip()
        if stripped.startswith("## "):
            return stripped[3:].strip()
    return "产品研发报告"


async def _generate_pdf(html: str, filepath: str) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_content(html, wait_until="networkidle")
        await page.pdf(
            path=filepath,
            format="A4",
            margin={"top": "2.2cm", "bottom": "2.5cm", "left": "2cm", "right": "2cm"},
            print_background=True,
        )
        await browser.close()


def markdown_to_pdf(markdown_text: str, filename: str = None) -> str:
    if not filename:
        filename = f"product_dev_{uuid.uuid4().hex[:8]}.pdf"
    if not filename.endswith(".pdf"):
        filename += ".pdf"

    extensions = ["tables", "fenced_code", "sane_lists"]
    html_body = markdown.markdown(markdown_text, extensions=extensions)

    title = _extract_title(markdown_text)
    cover = _build_cover_html(title)

    full_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><style>{CSS}</style></head>
<body>
{cover}
{html_body}
</body>
</html>"""

    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            pool.submit(asyncio.run, _generate_pdf(full_html, filepath)).result()
    else:
        asyncio.run(_generate_pdf(full_html, filepath))

    return filepath
