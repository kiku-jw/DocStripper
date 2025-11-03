DocStripper Improvement Plan (Quality-focused, Minimalist)

1. Repository audit and integration points
   1.1 Identify CLI extraction/cleaning flow in `tool.py`
   1.2 Identify Web extraction/cleaning flow in `docs/assets/app.js`
   1.3 List shared cleaning rules to mirror across JS/Python

2. Extraction robustness (foundation)
   2.1 Web (PDF.js): verify worker setup, errors, scanned/empty PDF notice
   2.2 CLI: verify PDF path (pdftotext or fallback), clean errors
   2.3 Tests: minimal corpus to confirm successful extraction across formats

3. Cleaning pipeline v1 (shared spec, two implementations)
   3.1 Rules: single-newline merge when no sentence-ending punctuation
   3.2 De-hyphenation across line breaks
   3.3 Remove page numbers and “Page X” lines
   3.4 Remove repeating headers/footers (simple heuristics)
   3.5 Remove filler lines (rules/underscores, lone bullets), collapse spaces, trim
   3.6 Preserve double newlines as paragraphs; avoid merging lists (bullets, 1.)

4. UX consistency and options
   4.1 Web: Advanced panel with toggles (defaults ON)
   4.2 CLI: mirror flags and clear --help with examples
   4.3 Counters: display brief stats of actions (removed/merged) in results

5. Performance & large files
   5.1 Web: page-wise processing to limit memory; responsive UI
   5.2 CLI: streaming-friendly processing; avoid huge in-memory buffers

6. Documentation & examples
   6.1 README/Wiki: what gets cleaned; before/after snippets
   6.2 Limitations (scanned PDFs, complex layouts, tables)
   6.3 Release notes summary

7. Optional refinements (only after core is stable)
   7.1 Abbreviation exceptions for sentence merge (Dr., Mr., etc.)
   7.2 Conservative/Aggressive presets mapping to toggles

Constraints
- Offline only; no heavy ML or cloud calls
- Minimal dependencies; readable code; small, tested heuristics
- Keep existing design/UX; do not expand scope beyond essentials

Execution Notes
- Implement in small, testable steps; keep UI consistent between web and CLI
- After each step, update WORKLOG.md and check in changes

FINAL RELEASE SPRINT

8. Release preparation (Critical)
   8.1 Create git tag with version number
   8.2 Write release notes highlighting Cleaning v1 improvements
   8.3 Update Wiki/Home page with latest features

9. Quality assurance (Critical)
   9.1 Mini-QA: Test 5-10 real PDF/DOCX files (multi-page, multilingual)
   9.2 Document any edge cases found
   9.3 Fix critical issues if any

10. Web stats enhancement (Useful)
    10.1 Add brief statistics line in web results ("Merged X, Dehyphenated Y...")
    10.2 Display in results summary section

11. Final GitHub update ✅
    11.1 Push all changes ✅
    11.2 Create release on GitHub (tag v2.0.0 created) ✅

RELEASE COMPLETE - v2.0.0 tagged and pushed

---

## UX ENHANCEMENTS SPRINT (v2.1.0)

12. Human-readable cleaning temperament slider ✅
    12.1 Replace Conservative/Aggressive radio buttons with range slider (Gentle to Aggressive) ✅
    12.2 Add visual feedback and tooltips for slider positions ✅
    12.3 Map slider values to existing cleaning mode logic ✅

13. Onboarding and trust signals ✅
    13.1 Add first-visit tooltip about privacy (offline, nothing sent) ✅
    13.2 Add "Works Offline" badge in corner ✅
    13.3 Enhance persistent settings with restoration notification ✅

14. Performance and feedback ✅
    14.1 Implement WebWorker for cleaning (prevent UI freezing) ✅
    14.2 Add ZIP download feedback notification ✅
    14.3 Add support snackbar after cleaning completion ✅

15. Distribution and tooling
    15.1 Prepare CLI for Homebrew formula
    15.2 Prepare CLI for PyPI package
    15.3 Improve self-test script for release validation

16. Analytics (privacy-friendly) ✅
    16.1 Add Plausible or Umami analytics (1 line, no cookies) ✅


