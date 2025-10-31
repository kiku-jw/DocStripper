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
- ⚙️ **Customizable Options** — Configure what gets removed
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
Confidential

Important content here.
Important content here.

1
2
3

Page 2 of 10
```

**After:**
```
Important content here.
```

---

## 🎨 What Gets Removed?

- **Page numbers** — Lines with only digits (1, 2, 3...), Roman numerals (I, II, III), or letters (A, B, C)
- **Headers/Footers** — Common patterns like "Page X of Y", "Confidential", "DRAFT", "INTERNAL USE ONLY"
- **Duplicate lines** — Consecutive identical lines
- **Empty lines** — Whitespace-only lines (optional: preserve paragraph spacing)
- **Punctuation lines** — Lines with only symbols (---, ***, ===)

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

---

## 🔧 Requirements

- **Python 3.9+**
- **PDF support** (optional): `pdftotext` from poppler-utils

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

</div>
