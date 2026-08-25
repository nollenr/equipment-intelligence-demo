#!/usr/bin/env python3
"""Render the controlled A12 synthetic evidence pack into stable PDF snapshots."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "evidence"

GREEN = colors.HexColor("#0D302A")
MID_GREEN = colors.HexColor("#176354")
LIME = colors.HexColor("#C8E66A")
MUTED = colors.HexColor("#557069")
LIGHT = colors.HexColor("#F4F7F2")
LINE = colors.HexColor("#D7E0D9")
WARNING = colors.HexColor("#FFF0EB")

STYLES = getSampleStyleSheet()
STYLES.add(ParagraphStyle(name="DocTitle", parent=STYLES["Title"], fontName="Helvetica-Bold", fontSize=25, leading=28, textColor=GREEN, spaceAfter=12))
STYLES.add(ParagraphStyle(name="DocSubtitle", parent=STYLES["Normal"], fontSize=13, leading=18, textColor=MUTED, spaceAfter=24))
STYLES.add(ParagraphStyle(name="Section", parent=STYLES["Heading1"], fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=GREEN, spaceAfter=10))
STYLES.add(ParagraphStyle(name="Subsection", parent=STYLES["Heading2"], fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=MID_GREEN, spaceBefore=10, spaceAfter=5))
STYLES.add(ParagraphStyle(name="BodyCopy", parent=STYLES["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14, textColor=GREEN, spaceAfter=7))
STYLES.add(ParagraphStyle(name="Lead", parent=STYLES["BodyCopy"], fontSize=11, leading=16, textColor=MUTED, spaceAfter=12))
STYLES.add(ParagraphStyle(name="Callout", parent=STYLES["BodyCopy"], backColor=colors.HexColor("#EFF7D5"), borderColor=colors.HexColor("#98BD36"), borderWidth=1, borderPadding=9, spaceBefore=7, spaceAfter=10))
STYLES.add(ParagraphStyle(name="Warning", parent=STYLES["Callout"], backColor=WARNING, borderColor=colors.HexColor("#E7644B")))
STYLES.add(ParagraphStyle(name="Center", parent=STYLES["BodyCopy"], alignment=TA_CENTER))
STYLES.add(ParagraphStyle(name="SyntheticBanner", parent=STYLES["BodyCopy"], fontName="Helvetica-Bold", fontSize=7, leading=11, textColor=colors.HexColor("#853E31"), backColor=WARNING, borderPadding=(3, 8, 3, 8), spaceAfter=10))


def bullets(items, numbered=False):
    return ListFlowable(
        [ListItem(Paragraph(item, STYLES["BodyCopy"]), leftIndent=8) for item in items],
        bulletType="1" if numbered else "bullet",
        leftIndent=20,
        bulletFontName="Helvetica-Bold",
        bulletFontSize=8,
        bulletColor=MID_GREEN,
        spaceAfter=8,
    )


def metadata(rows):
    table = Table([[Paragraph(f"<b>{label.upper()}</b>", STYLES["BodyCopy"]), Paragraph(value, STYLES["BodyCopy"])] for label, value in rows], colWidths=[1.25 * inch, 3.85 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.75, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def header(title, context):
    table = Table([[Paragraph(f"<b>SYNTHETIC · {title}</b>", STYLES["BodyCopy"]), Paragraph(context.upper(), STYLES["BodyCopy"])]], colWidths=[4.6 * inch, 2.0 * inch])
    table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.75, LINE),
        ("TEXTCOLOR", (0, 0), (-1, -1), MUTED),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([
        Paragraph("SYNTHETIC DEMO DOCUMENT · NOT FOR FIELD USE", STYLES["SyntheticBanner"]),
        table,
        Spacer(1, 16),
    ])


def render(filename, code, version, total_pages, story):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / filename
    document = SimpleDocTemplate(
        str(target),
        pagesize=LETTER,
        leftMargin=0.68 * inch,
        rightMargin=0.68 * inch,
        # Leave the synthetic-use banner visibly clear of every page header.
        topMargin=0.88 * inch,
        bottomMargin=0.62 * inch,
        title=f"{code} v{version} — Synthetic demo document",
        author="Cockroach Labs synthetic NextEra demo",
    )

    def decorate(canvas, _doc):
        page = canvas.getPageNumber()
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(0.68 * inch, 0.42 * inch, 7.82 * inch, 0.42 * inch)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawString(0.68 * inch, 0.27 * inch, f"{code} · v{version}")
        canvas.drawRightString(7.82 * inch, 0.27 * inch, f"Page {page} of {total_pages}")
        canvas.restoreState()

    document.build(story, onFirstPage=decorate, onLaterPages=decorate)
    print(target)


def sd_manual():
    story = [
        Spacer(1, 1.3 * inch),
        Paragraph("SD-8400 Solar Inverter", STYLES["DocTitle"]),
        Paragraph("Cooling System, Operations &amp; Fault Response Manual", STYLES["DocSubtitle"]),
        metadata([
            ("Document", "SD-OM-8400"), ("Version", "3.9"), ("Effective", "April 2, 2026"),
            ("Status", "Approved — Synthetic"), ("Manufacturer", "Solara Dynamics (Synthetic)"),
        ]),
        PageBreak(),
        header("SD-8400 Cooling & Fault Manual", "Fan monitoring"),
        Paragraph("8. Cooling-Fan Monitoring", STYLES["Section"]),
        Paragraph("The SD-8400 compares each commanded fan-speed signal with the corresponding feedback signal and records a derived variance for equipment-health diagnostics.", STYLES["Lead"]),
        Paragraph("8.1 Interpreting command and feedback", STYLES["Subsection"]),
        metadata([
            ("Fan command", "Controller-requested fan speed; it does not prove mechanical rotation."),
            ("Fan feedback", "Reported speed; it may be affected by fan, connector, wiring, or sensing conditions."),
            ("Derived variance", "Absolute command/feedback difference; it identifies disagreement, not the failed component."),
        ]),
        Paragraph("8.2 Authorized response boundary", STYLES["Subsection"]),
        bullets([
            "Use site-approved procedures before inspecting or servicing cooling equipment.",
            "Do not bypass fan supervision, force a fan command, or clear a maintenance hold solely to restore output.",
            "Opening an enclosure or contacting internal components requires the applicable isolation and lockout/tagout process.",
        ]),
        Paragraph("<b>Safety note:</b> This synthetic manual does not replace site electrical-safety, isolation, or lockout/tagout requirements.", STYLES["Warning"]),
        PageBreak(),
        header("SD-8400 Cooling & Fault Manual", "Fault A12"),
        Paragraph("8.4 Fault A12 — Cooling Fan Feedback Variance", STYLES["Section"]),
        Paragraph("Fault A12 is asserted when the derived cooling-fan command/feedback variance exceeds the configured 12-percentage-point threshold during the controller diagnostic window. The inverter enters Maintenance Hold so the cooling system can be inspected before return to service.", STYLES["Lead"]),
        Paragraph("<b>Expected behavior:</b> A12 establishes that commanded and reported fan speed disagreed beyond the configured limit. It does not, by itself, prove a failed fan. Obstruction, connector or wiring conditions, feedback sensing, and intermittent mechanical drag remain possible until inspected.", STYLES["Callout"]),
        Paragraph("Required checks", STYLES["Subsection"]),
        bullets([
            "Keep the inverter in Maintenance Hold and confirm the event and diagnostic window with the control room.",
            "Inspect accessible intake screens, exhaust openings, fan guards, and the exterior cooling-air path for obstruction, contamination, or damage.",
            "Compare fan command and fan feedback. Treat missing, unstable, or persistently divergent feedback as unresolved.",
            "Use the approved site procedure before any internal inspection. Do not open energized compartments for this check.",
            "Apply the approved return-to-service checklist after corrective work; do not clear A12 solely because the alarm is acknowledged.",
        ], numbered=True),
        Paragraph("<b>Evidence interpretation:</b> High ambient temperature can increase fan demand, but ambient temperature alone does not explain excessive command/feedback variance or establish component failure.", STYLES["Callout"]),
    ]
    render("sd-8400-cooling-and-fault-manual-v3.9.pdf", "SD-OM-8400", "3.9", 3, story)


def babcock_procedure():
    story = [
        Spacer(1, 1.15 * inch),
        Paragraph("Babcock Ranch Inverter Fan-System Inspection", STYLES["DocTitle"]),
        Paragraph("Operations Procedure · SD-8400 Fleet", STYLES["DocSubtitle"]),
        metadata([
            ("Document", "BR-SOP-INV-FAN-016"), ("Version", "1.6"), ("Effective", "June 30, 2026"),
            ("Status", "Approved — Synthetic"), ("Owner", "Babcock Ranch Operations (Synthetic)"),
        ]),
        PageBreak(),
        header("Babcock Fan-System Inspection", "Scope and prerequisites"),
        Paragraph("5. Field Inspection", STYLES["Section"]),
        Paragraph("Use this procedure for an SD-8400 inverter placed in Maintenance Hold after fault A12. The steps below are limited to operator-authorized observation and exterior inspection.", STYLES["Lead"]),
        Paragraph("5.1 Preconditions", STYLES["Subsection"]),
        bullets([
            "Confirm the asset identifier, A12 event time, maintenance-hold state, and control-room work authorization.",
            "Record the peak and latest fan variance plus ambient conditions from the approved diagnostic window.",
            "Stop if there is visible damage, smoke, water intrusion into an electrical compartment, abnormal heat, or another unsafe condition.",
            "Do not remove guards or open an enclosure without the separate isolation and lockout/tagout procedure.",
        ]),
        Paragraph("<b>Stop-work boundary:</b> This procedure does not authorize energized internal inspection, fan replacement, or bypass of protective controls.", STYLES["Warning"]),
        PageBreak(),
        header("Babcock Fan-System Inspection", "Authorized sequence"),
        Paragraph("5.2 Authorized fan-system inspection", STYLES["Section"]),
        bullets([
            "Verify INV-102 remains in Maintenance Hold and notify the control room that inspection is beginning.",
            "From the exterior, inspect intake screens, exhaust openings, fan guards, and the visible cooling-air path for vegetation, dust loading, loose material, water, or physical damage.",
            "Review fan command and fan-feedback trends for the same time window. Record whether feedback is present, stable, and responsive when command changes.",
            "If the latest variance remains above 12 percentage points, feedback is missing or unstable, or abnormal noise or vibration is reported, keep the inverter in Maintenance Hold and create a qualified-maintenance work order.",
            "If corrective work is performed, record the disposition and use the approved return-to-service checklist. Acknowledging A12 is not sufficient for release.",
        ], numbered=True),
        Paragraph("Escalate to qualified maintenance when", STYLES["Subsection"]),
        bullets([
            "Access beyond exterior inspection is required.",
            "Debris cannot be safely removed under the current work authorization.",
            "Command/feedback disagreement persists after the exterior cooling path is confirmed clear.",
        ]),
    ]
    render("babcock-fan-inspection-procedure-v1.6.pdf", "BR-SOP-INV-FAN-016", "1.6", 3, story)


def return_checklist():
    story = [
        Spacer(1, 1.05 * inch),
        Paragraph("Inverter Cooling-System Return-to-Service Checklist", STYLES["DocTitle"]),
        Paragraph("Maintenance Release Control · SD-8400 / Fault A12", STYLES["DocSubtitle"]),
        metadata([
            ("Document", "FPL-CHK-INV-RTS-024"), ("Version", "2.4"), ("Effective", "July 8, 2026"),
            ("Status", "Approved — Synthetic"), ("Owner", "Commissioning & Maintenance (Synthetic)"),
        ]),
        PageBreak(),
        header("Cooling-System Return-to-Service", "Acceptance criteria"),
        Paragraph("3. Return-to-service acceptance criteria", STYLES["Section"]),
        Paragraph("Complete every applicable item before releasing an SD-8400 inverter from an A12 Maintenance Hold. An acknowledged alarm is not evidence that the underlying condition has cleared.", STYLES["Lead"]),
        bullets([
            "Record the authorized inspection or maintenance disposition, including any obstruction removed and any qualified work performed.",
            "Confirm intake screens, exhaust openings, guards, and the exterior cooling-air path are clear and restored to their approved configuration.",
            "Confirm fan feedback is present and stable. After fan command is stable at or above 80 percent, verify command/feedback variance remains at or below 5 percentage points for ten continuous minutes.",
            "Confirm no new A12 event occurs during the ten-minute verification interval and no abnormal fan noise or vibration is reported.",
            "Obtain control-room authorization, record the release, and monitor the next loaded operating interval for recurrence.",
        ], numbered=True),
        Paragraph("<b>Do not release:</b> If any acceptance criterion is unmet, feedback is missing or unstable, variance remains above 5 percentage points, or A12 repeats, retain Maintenance Hold and escalate to qualified maintenance.", STYLES["Warning"]),
        Spacer(1, 24),
        Table([["Field inspection / maintenance", "Control-room release"]], colWidths=[3.15 * inch, 3.15 * inch], style=TableStyle([
            ("LINEABOVE", (0, 0), (-1, -1), 0.75, colors.HexColor("#9FAEA9")),
            ("TEXTCOLOR", (0, 0), (-1, -1), MUTED),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
        ])),
    ]
    render("inverter-return-to-service-checklist-v2.4.pdf", "FPL-CHK-INV-RTS-024", "2.4", 2, story)


if __name__ == "__main__":
    sd_manual()
    babcock_procedure()
    return_checklist()
