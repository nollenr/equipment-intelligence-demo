# P09 Google Docs handoff

The P09 tracker-controller vertical slice ships with stable PDF snapshots and corporate Google Docs as its human-friendly source links. All three bookmarked URLs were supplied and configured on 2026-08-23.

Create one Google Doc from each HTML source, preserve the exact title and version, then add a bookmark to the exact heading listed below:

| Document version | Source file | Bookmarked heading | Configured Google Doc |
| --- | --- | --- | --- |
| `71000000-0000-4000-8000-000000000201` | `trc-8-tracker-controller-manual-v2.7.html` | `6.3 Fault P09 — Tracker Position Deviation` | [Open bookmarked section](https://docs.google.com/document/d/1KiG-L5ZFPfDf28mQOTbAs2ugnWQZqWST83ywMhPhs40/edit?tab=t.0#bookmark=id.xrqf121q45o1) |
| `71000000-0000-4000-8000-000000000202` | `citrus-tracker-row-inspection-procedure-v1.4.html` | `4.2 Authorized tracker-row inspection` | [Open bookmarked section](https://docs.google.com/document/d/1cqAPDIhou1H4xWBsF7AxQyYShl438OFJTO_DPR3KcFE/edit?tab=t.0#bookmark=id.mi8l4r25kmwf) |
| `71000000-0000-4000-8000-000000000203` | `tracker-return-to-automatic-checklist-v2.0.html` | `3. Return-to-automatic acceptance criteria` | [Open bookmarked section](https://docs.google.com/document/d/1_33jsvqOJwX_rSuM4iPXGF1PRwkBxjAERfb_uJvNZLU/edit?tab=t.0#bookmark=id.h2vh1ozhbu1u) |

The URLs are stored in seed 007 so a reset preserves them. CockroachDB retains the versioned PDF paths as immutable snapshot fallbacks.

All three documents and every PDF page must retain `SYNTHETIC DEMO DOCUMENT · NOT FOR FIELD USE`.
