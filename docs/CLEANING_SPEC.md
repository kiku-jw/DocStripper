Cleaning Specification (Web + CLI)

Scope
- Lightweight, deterministic heuristics. No ML/cloud. Offline only.

Order of Operations
1) De-hyphenation across line breaks: replace "-\n[a-z]+" → "\1".
2) Merge broken lines: merge single newlines to spaces when previous line does not end with [.!?] and current/next lines are not list markers; skip detected table blocks.
3) Whitespace normalization: collapse multiple spaces, replace tabs with spaces, trim trailing spaces; skip detected table blocks.
4) Unicode punctuation normalization (limited): smart quotes/dashes/ellipsis → ASCII equivalents.
5) Line filtering:
   - Remove empty/whitespace-only lines.
   - Remove punctuation-only lines (---, ***, ===, single bullets like •, *).
   - Remove page numbers (lines consisting solely of digits) and "Page X" / "Page X of Y" lines.
   - Remove known header/footer patterns (CONFIDENTIAL, DRAFT, etc.).
   - Remove repeating first/last non-empty lines across pages (≥70% of pages; len ≥ 8).
   - Collapse consecutive duplicate lines.

Protections
- Paragraphs: double newlines are preserved.
- Lists: do not merge lines that start with bullets ( -, •, *, · ) or ordered markers (\d+[.)]).
- Tables: heuristically detect blocks with consistent multiple-space columns; do not merge or normalize inside.

Options (defaults ON)
- Merge lines
- De-hyphenation
- Normalize whitespace
- Normalize Unicode punctuation
- Remove headers/footers/page numbers

Stats
- Track counts: lines removed, duplicates collapsed, empty lines removed, headers/footers removed, punctuation-only removed, dehyphenated tokens, repeating headers/footers removed, merged lines.

Parity
- Implement identical behavior in CLI (Python) and Web (JS) with matching defaults and toggle names.


