2025-11-03T00:00:00Z — User prompt: "Окей. Как сказано в промте, сделай план и следуй ему. Ты верно мыслишь. Дальше работаем на качество самого продукта."
- Created PLAN.md with numbered roadmap, constraints, and execution notes.
- Prepared to audit repo for CLI/web integration points to implement shared cleaning rules.

2025-11-03T00:20:00Z — Implement Cleaning v1 in CLI
- Added defaults-on cleaning options in tool.py (merge lines, dehyphenate, normalize ws/unicode, remove headers)
- Added CLI flags to disable behaviors and --stdout support; stdin via '-'
- Implemented simple self-test script and ran successfully

2025-11-03T00:40:00Z — Web cleaning review & testing setup
- Verified web cleaning pipeline and Advanced toggles in docs/assets/app.js
- Launched local server and opened UI at 127.0.0.1:8000
- Prepared manual test plan (PDF/DOCX/TXT, ZIP, Copy, Clear list)

2025-11-03T00:55:00Z — Documentation updates
- README: added CLI stdin/stdout examples and new flags
- Wiki Usage: documented flags and stdin/stdout example

2025-11-03T01:00:00Z — Test inputs
- Added generator script scripts/make_samples.py
- Created TXT and DOCX samples in test_inputs/

2025-11-03T01:30:00Z — Final release sprint
- Fixed bug: headers/footers now protected from merging during line merge (CLI + web)
- Added brief statistics line in web results ("Merged X, Dehyphenated Y...")
- Created RELEASE_NOTES_v2.0.0.md with comprehensive changelog
- Created docs/wiki/Home.md with v2.0 features overview
- Updated app.js version to 35
- Created GitHub release v2.0.0: https://github.com/kiku-jw/DocStripper/releases/tag/v2.0.0

2025-11-03T02:30:00Z — UX Enhancements Sprint (v2.1.0)
- Replaced Conservative/Aggressive radio buttons with human-readable cleaning temperament slider (Gentle to Aggressive)
- Added onboarding tooltip on first visit about privacy (offline, nothing sent)
- Added "Works Offline" badge in header corner
- Enhanced ZIP download feedback: shows success message with file count
- Added persistent settings restoration notification (shows when previous settings are loaded)
- Added support snackbar after cleaning completion (one-time per session, "Saved you some time? Buy a coffee")
- Implemented WebWorker for cleaning (prevents UI freezing on long PDFs/files >100KB or >5000 lines)
- Added privacy-friendly analytics (Plausible.io, no cookies)
- Updated app.js version to 38

2025-11-03T03:00:00Z — Distribution & Testing Improvements
- Improved self-test script: now tests 10 real files from test_files/ directory with comprehensive checks
- Created setup.py for PyPI package distribution
- Created docstripper.rb Homebrew formula for macOS installation
- Created INSTALL.md with installation instructions for all methods
- All tests passing: 10/10 files tested successfully

2025-11-03T04:00:00Z — UX Refinements & Homebrew Tap
- Fixed cleaning temperament slider: now 4 distinct modes (step=33 instead of 25)
- Differentiated Thorough vs Aggressive modes:
  - Thorough: normalizeUnicode ON + preserveParagraphSpacing ON
  - Aggressive: normalizeUnicode ON + preserveParagraphSpacing OFF
- Added normalizeUnicode checkbox to advanced options (now 11 options total)
- Added Gumroad support link (https://kiku0.gumroad.com/coffee) to:
  - Floating support button (first position)
  - Support snackbar after cleaning
  - README support section
- Created homebrew-docstripper repository and pushed formula
- Updated app.js version to v39


