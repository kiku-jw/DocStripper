# 🧹 DocStripper

> **Batch document cleaner** — Remove noise from text documents automatically

[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

**DocStripper** automatically cleans text documents by removing page numbers, headers/footers, duplicate lines, and empty lines.

**🌐 [Try it online →](https://kiku-jw.github.io/DocStripper2/)** — No installation needed!

---

## ✨ Features

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
git clone https://github.com/kiku-jw/DocStripper2.git
cd DocStripper2
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

- **Page numbers** — Lines with only digits (1, 2, 3...)
- **Headers/Footers** — Common patterns like "Page X of Y", "Confidential", "DRAFT"
- **Duplicate lines** — Consecutive identical lines
- **Empty lines** — Whitespace-only lines

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

[⭐ Star this repo](https://github.com/kiku-jw/DocStripper2) | [🌐 Try online](https://kiku-jw.github.io/DocStripper2/) | [🐛 Report Bug](https://github.com/kiku-jw/DocStripper2/issues)

</div>
