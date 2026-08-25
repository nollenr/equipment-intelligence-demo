#!/usr/bin/env python3
"""Render the controlled P09 synthetic tracker evidence pack."""

from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, Spacer, Table, TableStyle

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


BASE_PATH = Path(__file__).with_name("render-a12-source-pdfs.py")
SPEC = spec_from_file_location("evidence_pdf_base", BASE_PATH)
assert SPEC and SPEC.loader
BASE = module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)


def trc_manual():
    story = [
        Spacer(1, 1.3 * inch),
        Paragraph("TRC-8 Tracker Controller", BASE.STYLES["DocTitle"]),
        Paragraph("Operations, Position Feedback &amp; Fault Response Manual", BASE.STYLES["DocSubtitle"]),
        BASE.metadata([
            ("Document", "TRC-OM-008"), ("Version", "2.7"), ("Effective", "May 14, 2026"),
            ("Status", "Approved — Synthetic"), ("Manufacturer", "TrackRight Controls (Synthetic)"),
        ]),
        PageBreak(),
        BASE.header("TRC-8 Operations Manual", "Position monitoring"),
        Paragraph("6. Position Monitoring", BASE.STYLES["Section"]),
        Paragraph("The TRC-8 compares commanded row angle with measured position feedback and records absolute deviation during automatic tracking.", BASE.STYLES["Lead"]),
        Paragraph("6.1 Signal interpretation", BASE.STYLES["Subsection"]),
        BASE.metadata([
            ("Commanded angle", "Controller-requested row angle; it does not prove physical row position."),
            ("Measured angle", "Reported position; it may be affected by sensing, linkage, or drive conditions."),
            ("Position deviation", "Absolute difference; it identifies disagreement, not the failed component."),
        ]),
        Paragraph("6.2 Motion safety boundary", BASE.STYLES["Subsection"]),
        BASE.bullets([
            "Keep the affected row in Safe Stow Hold while position disagreement remains unresolved.",
            "Remain outside the tracker movement envelope and use the site-approved motion-control process.",
            "Contact with drive, torque-tube, linkage, or sensor components requires qualified maintenance and the applicable isolation and lockout/tagout procedure.",
        ]),
        Paragraph("<b>Safety note:</b> A stationary row may move unexpectedly if controls, stored energy, or an obstruction change. This synthetic manual does not replace site procedures.", BASE.STYLES["Warning"]),
        PageBreak(),
        BASE.header("TRC-8 Operations Manual", "Fault P09"),
        Paragraph("6.3 Fault P09 — Tracker Position Deviation", BASE.STYLES["Section"]),
        Paragraph("Fault P09 is asserted when absolute commanded-versus-measured row-position deviation exceeds 5.0 degrees during the controller diagnostic window. The affected row enters Safe Stow Hold and automatic motion is inhibited pending inspection.", BASE.STYLES["Lead"]),
        Paragraph("<b>Expected behavior:</b> P09 establishes that commanded and measured position disagreed beyond the configured limit. It does not, by itself, prove a failed actuator, position sensor, drive, or linkage. Obstruction, row interference, mechanical drag, feedback sensing, and control-path conditions remain possible until inspected.", BASE.STYLES["Callout"]),
        Paragraph("Required response", BASE.STYLES["Subsection"]),
        BASE.bullets([
            "Confirm the asset, P09 event window, and Safe Stow Hold with the control room.",
            "Review commanded angle, measured angle, position deviation, and drive-motor current for the same window.",
            "From outside the movement envelope, inspect the visible row path and structure for vegetation, debris, row-to-row interference, displaced modules, or damaged members.",
            "Do not command motion, enter the movement envelope, or touch drive components under this diagnostic step.",
            "Use the approved site inspection procedure and return-to-automatic checklist before release.",
        ], numbered=True),
        Paragraph("<b>Evidence interpretation:</b> Elevated drive current is consistent with increased loading, but neither current nor position deviation alone establishes the underlying cause.", BASE.STYLES["Callout"]),
    ]
    BASE.render("trc-8-tracker-controller-manual-v2.7.pdf", "TRC-OM-008", "2.7", 3, story)


def citrus_procedure():
    story = [
        Spacer(1, 1.15 * inch),
        Paragraph("Citrus Tracker-Row Inspection", BASE.STYLES["DocTitle"]),
        Paragraph("Operations Procedure · TRC-8 / Fault P09", BASE.STYLES["DocSubtitle"]),
        BASE.metadata([
            ("Document", "CIT-SOP-TRK-014"), ("Version", "1.4"), ("Effective", "July 2, 2026"),
            ("Status", "Approved — Synthetic"), ("Owner", "Citrus Solar Operations (Synthetic)"),
        ]),
        PageBreak(),
        BASE.header("Citrus Tracker-Row Inspection", "Scope and prerequisites"),
        Paragraph("4. Field Inspection", BASE.STYLES["Section"]),
        Paragraph("Use this procedure for a TRC-8 tracker row placed in Safe Stow Hold after P09. These steps authorize observation from outside the row movement envelope only.", BASE.STYLES["Lead"]),
        Paragraph("4.1 Preconditions", BASE.STYLES["Subsection"]),
        BASE.bullets([
            "Confirm row identifier, P09 event time, Safe Stow Hold, and control-room work authorization.",
            "Establish and maintain the marked movement exclusion zone for the full affected row.",
            "Record commanded angle, measured angle, deviation, and drive-current summaries.",
            "Stop for structural damage, loose modules, electrical hazards, unstable ground, or any condition requiring entry into the movement envelope.",
        ]),
        Paragraph("<b>Stop-work boundary:</b> This procedure does not authorize motion commands, entry beneath or between moving members, removal of guards, or contact with the drive, linkage, torque tube, or position sensor.", BASE.STYLES["Warning"]),
        PageBreak(),
        BASE.header("Citrus Tracker-Row Inspection", "Authorized sequence"),
        Paragraph("4.2 Authorized tracker-row inspection", BASE.STYLES["Section"]),
        BASE.bullets([
            "Verify TRK-01 remains in Safe Stow Hold and notify the control room that observation is beginning.",
            "From outside the movement envelope, inspect for vegetation, debris, pooled material, and row or module interference.",
            "Observe modules, supports, torque-tube alignment, linkage, and drive housing for displacement, bending, loose material, or impact evidence. Do not touch components.",
            "Compare commanded and measured angle. Record whether feedback is present, stable, and responsive; record abnormal or sustained drive-current loading.",
            "If deviation remains above 5.0 degrees, feedback is unstable, current remains above 7.5 amperes, or the path is not clear, retain Safe Stow Hold and create a qualified-maintenance work order.",
        ], numbered=True),
        Paragraph("Escalate to qualified maintenance when", BASE.STYLES["Subsection"]),
        BASE.bullets([
            "A check requires entry into the movement envelope or component contact.",
            "An obstruction cannot be characterized from outside the exclusion zone.",
            "Disagreement or elevated loading persists after the visible path is clear.",
        ]),
    ]
    BASE.render("citrus-tracker-row-inspection-procedure-v1.4.pdf", "CIT-SOP-TRK-014", "1.4", 3, story)


def return_checklist():
    story = [
        Spacer(1, 1.05 * inch),
        Paragraph("Tracker Return-to-Automatic Checklist", BASE.STYLES["DocTitle"]),
        Paragraph("Maintenance Release Control · TRC-8 / Fault P09", BASE.STYLES["DocSubtitle"]),
        BASE.metadata([
            ("Document", "FPL-CHK-TRK-RTA-020"), ("Version", "2.0"), ("Effective", "July 16, 2026"),
            ("Status", "Approved — Synthetic"), ("Owner", "Commissioning & Maintenance (Synthetic)"),
        ]),
        PageBreak(),
        BASE.header("Tracker Return-to-Automatic", "Acceptance criteria"),
        Paragraph("3. Return-to-automatic acceptance criteria", BASE.STYLES["Section"]),
        Paragraph("Complete every applicable item before releasing a TRC-8 tracker row from P09 Safe Stow Hold. Acknowledging the alarm does not establish that the underlying condition has cleared.", BASE.STYLES["Lead"]),
        BASE.bullets([
            "Record the inspection or maintenance disposition and confirm the movement envelope is clear of people, vehicles, tools, vegetation, debris, and row interference.",
            "Confirm position feedback is present and stable before a qualified operator initiates supervised motion under the approved motion-control procedure.",
            "Complete three supervised commanded moves. For each move, verify absolute commanded-versus-measured deviation remains at or below 2.0 degrees.",
            "Verify drive-motor current remains at or below 6.5 amperes during each supervised move and no abnormal noise, vibration, binding, or new P09 event is observed.",
            "Obtain control-room authorization, record release to Automatic Tracking, and monitor the next tracking interval for recurrence.",
        ], numbered=True),
        Paragraph("<b>Do not release:</b> If any criterion is unmet, feedback is missing or unstable, deviation exceeds 2.0 degrees, drive current exceeds 6.5 amperes, or P09 repeats, retain Safe Stow Hold and escalate to qualified maintenance.", BASE.STYLES["Warning"]),
        Spacer(1, 24),
        Table([["Qualified operator / maintenance", "Control-room release"]], colWidths=[3.15 * inch, 3.15 * inch], style=TableStyle([
            ("LINEABOVE", (0, 0), (-1, -1), 0.75, colors.HexColor("#9FAEA9")),
            ("TEXTCOLOR", (0, 0), (-1, -1), BASE.MUTED),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
        ])),
    ]
    BASE.render("tracker-return-to-automatic-checklist-v2.0.pdf", "FPL-CHK-TRK-RTA-020", "2.0", 2, story)


if __name__ == "__main__":
    trc_manual()
    citrus_procedure()
    return_checklist()
