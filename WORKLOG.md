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


