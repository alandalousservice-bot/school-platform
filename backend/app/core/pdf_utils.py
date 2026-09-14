"""
أدوات توليد تقارير PDF بالعربية.

ملاحظة تقنية مهمة: مكتبة reportlab لا تدعم تشكيل الحروف العربية (اتصال الحروف
ببعضها بأشكالها الصحيحة) ولا خوارزمية الاتجاه الثنائي (BiDi) تلقائيًا. لذلك
يمرَّر أي نص عربي عبر arabic_reshaper (لتحويل الحروف المنفصلة إلى شكلها
المتصل الصحيح) ثم عبر python-bidi (لإعادة ترتيب النص بصريًا من اليمين
لليسار)، قبل تمريره إلى reportlab. تجاهل هذه الخطوة ينتج نصًا عربيًا
مبعثرًا وغير مقروء في الملف الناتج.

يحتاج العرض الصحيح أيضًا إلى خط عربي حقيقي (Helvetica الافتراضي في reportlab
لا يحتوي حروفًا عربية). ضع ملف خط .ttf (مثل Amiri أو Noto Naskh Arabic) في:
    backend/app/static/fonts/arabic.ttf
أو حدّد مسارًا مخصصًا عبر متغير البيئة ARABIC_FONT_PATH.
إن لم يوجد أي خط، يُستخدم Helvetica كحل احتياطي مؤقت مع تنبيه واضح داخل
التقرير نفسه بدل فشل صامت أو عطل كامل.
"""
import os
from datetime import date

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

FONT_PATH = os.getenv(
    "ARABIC_FONT_PATH",
    os.path.join(os.path.dirname(__file__), "..", "static", "fonts", "arabic.ttf"),
)
FONT_NAME = "ArabicReport"
_font_registered = False


def _ensure_font() -> bool:
    """يسجّل الخط العربي مرة واحدة فقط. يرجع False إن لم يوجد الملف (حل احتياطي)."""
    global _font_registered
    if _font_registered:
        return True
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont(FONT_NAME, FONT_PATH))
        _font_registered = True
        return True
    return False


def ar(text) -> str:
    """يهيّئ نصًا عربيًا للعرض الصحيح داخل PDF (تشكيل الحروف + اتجاه العرض)."""
    if text is None:
        return ""
    reshaped = arabic_reshaper.reshape(str(text))
    return get_display(reshaped)


PERIOD_LABELS = {"MORNING": "صباحية", "AFTERNOON": "مسائية"}


def build_absence_report_pdf(buffer, start: date, end: date, rows: list[dict]) -> None:
    """
    يبني تقرير غياب PDF ويكتبه في buffer (BytesIO).
    rows: [{"date": date, "classroom": str, "student": str, "period": "MORNING"|"AFTERNOON"}]
    """
    has_font = _ensure_font()
    font = FONT_NAME if has_font else "Helvetica"

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=18 * mm, bottomMargin=15 * mm, leftMargin=15 * mm, rightMargin=15 * mm,
        title="تقرير الغياب",
    )

    title_style = ParagraphStyle("title", fontName=font, fontSize=16, alignment=1, spaceAfter=4)
    sub_style = ParagraphStyle(
        "sub", fontName=font, fontSize=10, alignment=1,
        textColor=colors.HexColor("#4B5670"), spaceAfter=14,
    )

    elements = [
        Paragraph(ar("تقرير الغياب"), title_style),
        Paragraph(ar(f"من {start.isoformat()} إلى {end.isoformat()}"), sub_style),
    ]

    if not has_font:
        elements.append(Paragraph(
            "Warning: no Arabic font found on the server (see ARABIC_FONT_PATH) "
            "&mdash; Arabic text below may not render correctly.",
            ParagraphStyle("warn", fontName="Helvetica", fontSize=8, textColor=colors.red, spaceAfter=10),
        ))

    header = [ar("القسم"), ar("التلميذ"), ar("الفترة"), ar("التاريخ")]
    table_data = [header]
    for r in rows:
        table_data.append([
            ar(r["classroom"]),
            ar(r["student"]),
            ar(PERIOD_LABELS.get(r["period"], r["period"])),
            r["date"].isoformat(),
        ])
    if len(table_data) == 1:
        table_data.append([ar("لا يوجد غياب مسجَّل في هذه الفترة"), "", "", ""])

    table = Table(table_data, colWidths=[45 * mm, 55 * mm, 30 * mm, 30 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE1E8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)

    elements.append(Spacer(1, 18))
    total_style = ParagraphStyle("total", fontName=font, fontSize=10, alignment=2)
    elements.append(Paragraph(ar(f"إجمالي حالات الغياب: {len(rows)}"), total_style))

    doc.build(elements)
