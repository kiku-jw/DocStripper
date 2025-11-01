<div align="center">
  <img src="docs/assets/icon.svg?v=2" alt="DocStripper Logo" width="120">
  
  # 🧹 DocStripper
  
  > **AI-powered batch document cleaner** — Remove noise from text documents automatically
</div>

[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)
[![Product Hunt](https://img.shields.io/badge/Product%20Hunt-Featured-orange)](https://www.producthunt.com/products/docstripper)

**DocStripper** automatically removes noise from text documents. Remove page numbers, headers/footers, duplicate lines, and empty lines from `.txt`, `.docx`, and `.pdf` files (PDF support in CLI only). Choose between **Fast Clean** (instant) or **Smart Clean** (AI-powered). Works entirely in your browser - 100% private, no uploads, no sign-ups.

**🌐 [Try it online →](https://kiku-jw.github.io/DocStripper/)** — No installation needed!

---

## ✨ Features

- ⚡ **Fast Clean** — Instant rule-based cleaning
- 🤖 **Smart Clean (Beta)** — AI-powered cleaning with on-device LLM
- 🛡️ **Conservative Mode** — Safe defaults (recommended)
- ⚡ **Aggressive Mode** — More aggressive cleaning
- 🔄 **Side-by-Side Preview** — Compare Original | Cleaned
- 💾 **Settings Persistence** — Your preferences are saved automatically
- 🔒 **100% Private** — All processing happens in your browser
- 📊 **Real-time Statistics** — See exactly what was removed
- 📥 **Download & Copy** — Download cleaned files or copy to clipboard
- 🎨 **Dark Theme** — Toggle between light and dark themes
- 📱 **Mobile Responsive** — Works great on mobile devices

---

## 🎯 Quick Start

### Web App (Recommended)

1. Visit [https://kiku-jw.github.io/DocStripper/](https://kiku-jw.github.io/DocStripper/)
2. Upload your files
3. Choose **Fast Clean** (instant) or **Smart Clean** (AI-powered)
4. Select **Conservative** (safe) or **Aggressive** (more thorough)
5. Click "Start Cleaning"
6. Download or copy the cleaned results

### CLI Tool

```bash
# Install
git clone https://github.com/kiku-jw/DocStripper.git
cd DocStripper

# Clean a file
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
```

**After (Conservative Mode):**
```
Executive Summary
This is automatic text processing.
Important content here.
More content.
```

**Key Changes:**
- ✅ Page numbers removed
- ✅ Headers/footers removed
- ✅ Repeating headers removed
- ✅ Duplicates collapsed
- ✅ Hyphenation fixed
- ✅ Empty lines removed

---

## 🎨 What Gets Removed?

### Conservative Mode (Default - Recommended)
- Page numbers (1, 2, 3...)
- Headers/footers ("Page X of Y", "Confidential", etc.)
- Repeating headers/footers across pages
- Duplicate lines
- Empty lines
- Punctuation-only lines (---, ***, ===)
- Hyphenation fixed (auto-\nmatic → automatic)

### Aggressive Mode
All Conservative features plus:
- Merges broken lines (protects lists and tables)
- Normalizes whitespace (protects tables)

**Protection Features:**
- ✅ Lists are never merged or broken
- ✅ Tables preserve spacing
- ✅ Content headers never removed

---

## 🛠️ Supported Formats

| Format | Status | Notes |
|--------|--------|-------|
| `.txt` | ✅ Full | UTF-8, Latin-1 |
| `.docx` | ✅ Basic | Text extraction only |
| `.pdf` | ✅ Basic | Requires `pdftotext` (poppler-utils) |

**PDF Support:**
- macOS: `brew install poppler`
- Ubuntu/Debian: `sudo apt-get install poppler-utils`
- Windows: Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)

---

## 🔧 Requirements

- **Python 3.9+** (for CLI tool)
- **PDF support** (optional): `pdftotext` from poppler-utils

---

## 📝 License

MIT License — see [LICENSE.txt](LICENSE.txt) for details.

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
