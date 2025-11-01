<div align="center">
  <img src="docs/assets/icon.svg?v=2" alt="DocStripper Logo" width="120">
  
  # 🧹 DocStripper
  
  > **AI-powered batch document cleaner** — Remove noise from text documents automatically with Fast or Smart Clean modes
</div>

[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)
[![Product Hunt](https://img.shields.io/badge/Product%20Hunt-Featured-orange)](https://www.producthunt.com/products/docstripper)

**DocStripper** — AI-powered batch document cleaner that automatically removes noise from text documents. Remove page numbers, headers/footers, duplicate lines, and empty lines from `.txt`, `.docx`, and `.pdf` files. Choose between **Fast Clean** (instant rule-based) or **Smart Clean** (AI-powered with on-device LLM). Works entirely in your browser - 100% private, no uploads, no sign-ups. Perfect for students, researchers, and anyone working with scanned documents or PDFs.

**🌐 [Try it online →](https://kiku-jw.github.io/DocStripper/)** — No installation needed!

**Web App Features:**
- ⚡ **Fast Clean** — Instant rule-based cleaning
- 🤖 **Smart Clean (Beta)** — AI-powered cleaning with on-device LLM
  - Requires WebGPU support (most modern browsers)
  - One-time download of ~100-200 MB (model weights)
  - Works offline after first load
  - Fully customizable via cleaning options

---

## ✨ Features

### Web Application
- 🚀 **Fast Clean** — Rule-based cleaning (instant)
- 🤖 **Smart Clean (Beta)** — AI-powered cleaning using on-device LLM (WebLLM)
- 🛡️ **Conservative Mode** — Safe defaults (recommended, preserves lists and tables)
- ⚡ **Aggressive Mode** — More aggressive cleaning with merge and whitespace normalization
- ⚙️ **Customizable Options** — Configure what gets removed
- 🔄 **Side-by-Side Preview** — Compare Original | Cleaned with virtualization for large files
- 💾 **Settings Persistence** — Your preferences are saved automatically
- 🔒 **100% Private** — All processing happens in your browser
- 📊 **Real-time Statistics** — See exactly what was removed
- 📥 **Download & Copy** — Download cleaned files or copy to clipboard
- 🎨 **Dark Theme** — Toggle between light and dark themes

### CLI Tool
- 🚀 **Fast & Lightweight** — Uses only Python stdlib, no external packages
- 🔒 **Privacy-First** — All processing happens offline
- 📊 **Dry-Run Mode** — Preview changes before applying
- 🔄 **Undo Support** — Restore files from backups
- 🌍 **Cross-Platform** — Works on Windows, macOS, and Linux
- 📚 **Multiple Formats** — Supports `.txt`, `.docx`, and `.pdf` files

---

## 🎯 Quick Start

### Installation

```bash
git clone https://github.com/kiku-jw/DocStripper.git
cd DocStripper
```

### Usage

```bash
# Clean a single file
python tool.py document.txt

# Clean multiple files
python tool.py file1.txt file2.txt file3.docx

# Preview changes (dry-run)
python tool.py --dry-run document.txt

# Undo last operation
python tool.py --undo
```

---

## 📖 Example

**Before:**
```
Page 1 of 10
Confidential - Internal Use Only
Executive Summary
This is auto-
matic text processing.
Important content here.
Important content here.

1
2
3

Page 2 of 10
Confidential - Internal Use Only
More content.
```

**After (Conservative Mode):**
```
Executive Summary
This is automatic text processing.
Important content here.
More content.
```

**After (Aggressive Mode):**
```
Executive Summary
This is automatic text processing. Important content here.
More content.
```

**Key Changes:**
- Page numbers removed (1, 2, 3)
- Headers/footers removed (Page X of Y, Confidential)
- Repeating headers removed (Confidential - Internal Use Only appeared on 2/2 pages)
- Duplicates collapsed (Important content here.)
- Hyphenation fixed (auto-\nmatic → automatic)
- Empty lines removed
- *(Aggressive mode also merged broken lines)*

---

## 🎨 What Gets Removed?

### Basic Cleaning (Conservative Mode - Default)
- **Page numbers** — Lines with only digits (1, 2, 3...), Roman numerals (I, II, III), or letters (A, B, C)
- **Headers/Footers** — Common patterns like "Page X of Y", "Confidential", "DRAFT", "INTERNAL USE ONLY"
- **Repeating Headers/Footers** — Headers/footers that appear on ≥70% of pages (detected automatically)
- **Duplicate lines** — Consecutive identical lines
- **Empty lines** — Whitespace-only lines (optional: preserve paragraph spacing)
- **Punctuation lines** — Lines with only symbols (---, ***, ===) or single bullets (•, *, ·)
- **Hyphenation** — Safe dehyphenation: "auto-\nmatic" → "automatic" (only lowercase continuations)

### Advanced Cleaning (Aggressive Mode)
All Conservative features plus:
- **Merge Broken Lines** — Merge lines broken mid-sentence (protects lists and tables)
- **Whitespace Normalization** — Collapse multiple spaces, normalize tabs (protects tables)
- **Unicode Punctuation** — Normalize curly quotes and dashes to ASCII (optional, default OFF)

### Protection Features
- **List Protection** — Bullet and numbered lists are never merged or broken
- **Table Protection** — Table spacing is preserved when normalization is enabled
- **Content Safety** — Content headers and meaningful text are never removed

## 🎛️ Cleaning Modes

### Conservative Mode (Default)
Safe defaults recommended for most users:
- ✅ Removes noise (headers, footers, page numbers, duplicates)
- ✅ Dehyphenates broken words
- ✅ Removes repeating headers/footers across pages
- ✅ Preserves lists and tables
- ✅ Never merges lines or normalizes whitespace

### Aggressive Mode
For more aggressive cleaning:
- ✅ All Conservative features enabled
- ✅ Merges broken lines (with list/table protection)
- ✅ Normalizes whitespace (with table protection)
- ⚠️ Use with caution: may affect formatting in some documents

---

## 🛠️ Supported Formats

| Format | Status | Notes |
|--------|--------|-------|
| `.txt` | ✅ Full | UTF-8, Latin-1 |
| `.docx` | ✅ Basic | Text extraction only |
| `.pdf` | ✅ Basic | Requires `pdftotext` (poppler-utils) |

**PDF Support Installation:**

- **macOS:** `brew install poppler`
- **Ubuntu/Debian:** `sudo apt-get install poppler-utils`
- **Windows:** Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)

---

## 📊 Command Line Options

```bash
python tool.py [OPTIONS] [FILES...]

Options:
  -h, --help     Show help message
  --dry-run      Preview changes without modifying files
  --undo         Restore files from last operation
```

**Note:** CLI version uses Conservative mode by default. Advanced features (merge lines, whitespace normalization) are available programmatically but disabled by default for safety.

---

## 🔧 Requirements

- **Python 3.9+**
- **PDF support** (optional): `pdftotext` from poppler-utils

## 🧪 Testing

See [SELF_TESTS.md](SELF_TESTS.md) for manual test steps and expected results.

Test fixtures are available in the `examples/` directory:
- `fixture1_headers_footers.txt` - Headers/footers + page numbers
- `fixture2_hyphenation.txt` - Hyphenation + mid-sentence wraps
- `fixture3_lists_tables.txt` - Lists & pseudo-tables

## 🔍 Technical Details

### Confidence Thresholds
- **Repeating Headers/Footers**: Requires ≥70% frequency across pages and ≥8 characters (to avoid removing short content headers)

### Protection Mechanisms
- **List Detection**: Recognizes bullet lists (`-`, `•`, `*`, `·`) and numbered lists (`1.`, `1)`)
- **Table Detection**: Detects ≥3 consecutive lines with ≥2 runs of ≥2 spaces at similar positions
- **Dehyphenation Safety**: Only merges when hyphen is followed by lowercase continuation (avoids false positives)

### Performance
- **Conservative Mode**: Single pass, instant for files < 1MB
- **Aggressive Mode**: May require chunking for files > 1MB
- **Web Version**: Virtualization for files > 1MB ensures smooth UI

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE.txt](LICENSE.txt) file for details.

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">

**Made with ❤️ for clean documents**

[⭐ Star this repo](https://github.com/kiku-jw/DocStripper) | [🌐 Try online](https://kiku-jw.github.io/DocStripper/) | [🚀 Product Hunt](https://www.producthunt.com/products/docstripper) | [🐛 Report Bug](https://github.com/kiku-jw/DocStripper/issues)

---

## 💝 Support

Support this project and help keep it free:

[☕ Buy Me a Coffee](https://buymeacoffee.com/kiku) | [🙏 Thanks.dev](https://thanks.dev/d/gh/kiku-jw) | [💚 Ko-fi](https://ko-fi.com/kiku_jw)

## 🔗 Connect

- 📰 **Blog & Updates**: [t.me/kiku_blog](https://t.me/kiku_blog)
- 💬 **Discord**: [discord.gg/4Kxs97JvsU](https://discord.gg/4Kxs97JvsU)
- 💼 **LinkedIn**: [linkedin.com/in/kiku-jw](https://www.linkedin.com/in/kiku-jw/)
- 🌐 **About.me**: [about.me/kiku_jw](https://about.me/kiku_jw)

</div>
