# DocStripper v2.0.0 - Quality Release

## 🎯 Major Improvements

### Cleaning Pipeline v1 (Critical Upgrade)
Unified, production-ready cleaning logic with smart defaults enabled:

- **Line Merging**: Automatically merges broken lines mid-sentence (protects lists, tables, headers)
- **De-hyphenation**: Fixes words split across line breaks (auto-\nmatic → automatic)
- **Header/Footer Removal**: Removes page numbers, "Page X of Y", and repeating headers/footers across pages
- **Whitespace Normalization**: Collapses multiple spaces, normalizes tabs (protects tables)
- **Unicode Normalization**: Converts smart quotes and dashes to ASCII equivalents

### Protection Mechanisms
- **Lists**: Never merged (bullet points, numbered lists)
- **Tables**: Detected and preserved (spacing maintained)
- **Headers**: Protected from being merged with content

### CLI Enhancements
- **New Flags**: `--no-merge-lines`, `--no-dehyphenate`, `--no-normalize-ws`, `--no-normalize-unicode`, `--keep-headers`
- **stdin/stdout Support**: Pipe documents through DocStripper: `cat file.pdf | tool.py - --stdout > clean.txt`
- **All cleaning options ON by default** (can be disabled via flags)

### Web UI Improvements
- **Brief Statistics Line**: Shows "Merged X lines, Dehyphenated Y tokens..." in results summary
- **Consistent Options**: Web checkboxes match CLI flags exactly
- **Clear List Button**: Quickly reset and start over

### Bug Fixes
- Fixed header/footer merging issue: headers no longer get merged with content during line merging
- Improved pattern recognition for multilingual headers (Russian "Страница X из Y")

## 📊 What Gets Cleaned (Default Behavior)

### Conservative Mode (Recommended)
✅ Page numbers (1, 2, 3...)  
✅ Headers/footers ("Page X of Y", "Confidential", etc.)  
✅ Repeating headers/footers across pages  
✅ Duplicate lines  
✅ Empty lines  
✅ Punctuation-only lines (---, ***, ===)  
✅ Hyphenation fixed (auto-\nmatic → automatic)  

### Aggressive Mode
All Conservative features plus:
✅ Merges broken lines (protects lists and tables)  
✅ Normalizes whitespace (protects tables)  

## 🛠️ Migration Guide

### CLI
No breaking changes. Existing scripts continue to work, but now benefit from improved cleaning by default.

To disable specific features:
```bash
python tool.py --no-merge-lines --no-dehyphenate document.txt
```

### Web
No changes required. Default settings are optimal for most users. Toggle "Advanced Options" to customize.

## 📝 Technical Details

- **Cleaning Order**: De-hyphenation → Line Merging → Whitespace Normalization → Unicode Normalization → Line Filtering
- **Shared Logic**: Web (JavaScript) and CLI (Python) implement identical cleaning rules
- **Performance**: Optimized for large documents (tested up to 500+ pages)
- **Memory**: Efficient streaming for CLI, page-wise processing for web

## 🙏 Credits

Based on competitor analysis and best practices from:
- PyPDF, PyMuPDF (PDF extraction)
- Unstructured, Docling (document processing)
- Document Cleaner (cleaning heuristics)

## 📚 Documentation

- Updated README with CLI flags and examples
- Wiki Usage guide updated with stdin/stdout examples
- Cleaning specification document added

---

**Full Changelog**: See [GitHub Commits](https://github.com/kiku-jw/DocStripper/compare/v1.3.0...v2.0.0)

