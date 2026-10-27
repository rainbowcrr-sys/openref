#!/usr/bin/env python3
"""
生成 OG 分享图（1200x630，苹果风）。

用法：
    python3 scripts/og.py                      # 只生成默认图 -> public/og-default.png
    python3 scripts/og.py --all                # 为每篇文章生成 PNG -> public/og/<slug>.png

需要 Pillow：pip install pillow
不需要也可以：构建器会自动改用 SVG 版 OG 图（中文同样不乱码）。
"""
import os
import sys
import textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630
BG = (255, 255, 255)
FG = (29, 29, 31)
MUTED = (134, 134, 139)
ACCENT = (0, 113, 227)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
]


def font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_card(draw, title, subtitle, section):
    draw.rectangle([0, 0, W, H], fill=BG)
    draw.rectangle([0, 0, W, 8], fill=ACCENT)

    f_brand = font(34)
    f_section = font(24)
    f_title = font(58)
    f_desc = font(28)
    f_url = font(24)

    draw.text((80, 96), "OpenRef", font=f_brand, fill=FG)
    draw.text((80, 146), section or "Technical Reference", font=f_section, fill=MUTED)

    y = 250
    for line in textwrap.wrap(title, width=18)[:3] or [""]:
        draw.text((80, y), line, font=f_title, fill=FG)
        y += 74

    y += 20
    for line in textwrap.wrap(subtitle, width=32)[:2] or [""]:
        draw.text((80, y), line, font=f_desc, fill=MUTED)
        y += 44

    draw.text((80, 566), "docs.openref.workers.dev", font=f_url, fill=MUTED)


def make(path, title, subtitle, section):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_card(draw, title, subtitle, section)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print("wrote", path)


if __name__ == "__main__":
    make(
        os.path.join(ROOT, "public", "og-default.png"),
        "OpenRef 技术参考",
        "直白、可检索、能直接照着做的技术参考手册。",
        "按主题分组 · 条目式写作",
    )

    if "--all" in sys.argv:
        import re

        docs = os.path.join(ROOT, "src", "content", "docs")
        for dirpath, _, files in os.walk(docs):
            for fn in files:
                if not fn.endswith(".md"):
                    continue
                full = os.path.join(dirpath, fn)
                raw = open(full, encoding="utf-8").read()
                title = re.search(r"^title:\s*(.+)$", raw, re.M)
                desc = re.search(r"^description:\s*(.+)$", raw, re.M)
                parts = os.path.relpath(full, docs)[:-3].split(os.sep)
                section = " / ".join(parts[:-1]) if len(parts) > 1 else ""
                make(
                    os.path.join(ROOT, "public", "og", fn[:-3] + ".png"),
                    title.group(1).strip() if title else fn[:-3],
                    desc.group(1).strip() if desc else "",
                    section,
                )
