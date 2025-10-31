# 🧹 DocStripper

> **Batch document cleaner** — Remove noise from text documents automatically

[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)
[![Code Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://www.python.org/dev/peps/pep-0008/)

**DocStripper** is a lightweight CLI utility that automatically cleans text documents by removing:
- 📄 Page numbers and headers/footers
- 🔁 Duplicate consecutive lines
- 📝 Empty lines and whitespace
- 🏷️ Common markers (Confidential, DRAFT, etc.)

All processing happens **offline** using only Python standard library — no external dependencies required!

---

## ✨ Features

- 🚀 **Fast & Lightweight** — Uses only Python stdlib, no external packages
- 🔒 **Privacy-First** — All processing happens offline, no data sent anywhere
- 📊 **Dry-Run Mode** — Preview changes before applying them
- 🔄 **Undo Support** — Easily restore files from backups
- 📈 **Detailed Statistics** — See exactly what was removed
- 🌍 **Cross-Platform** — Works on Windows, macOS, and Linux
- 📚 **Multiple Formats** — Supports `.txt`, `.docx`, and `.pdf` files

---

## 🎯 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/kiku-jw/DocStripper2.git
cd DocStripper2

# Make executable (optional)
chmod +x tool.py
```

### Basic Usage

```bash
# Clean a single file
python tool.py document.txt

# Clean multiple files
python tool.py file1.txt file2.txt file3.docx

# Preview changes without modifying files
python tool.py --dry-run document.txt

# Clean all text files in current directory
python tool.py *.txt
```

---

## 📖 Examples

### Example 1: Clean a messy document

**Before:**
```
Page 1 of 10
Confidential

Important content here.
Important content here.
Important content here.

1
2
3

Page 2 of 10
...
```

**After:**
```
Important content here.
...
```

**Command:**
```bash
python tool.py messy_document.txt
```

### Example 2: Preview changes

```bash
python tool.py --dry-run important_report.pdf
```

**Output:**
```
Processing: important_report.pdf
  - Lines removed: 45
  - Duplicates collapsed: 12
  - Empty lines removed: 18
  - Headers/footers removed: 15
  [DRY RUN] Would clean important_report.pdf
```

### Example 3: Batch processing

```bash
python tool.py *.txt *.docx
```

Processes all matching files and creates backups automatically.

### Example 4: Undo changes

```bash
# Restore files from last operation
python tool.py --undo
```

---

## 🛠️ Supported Formats

| Format | Support | Requirements |
|--------|---------|--------------|
| `.txt` | ✅ Full | UTF-8, Latin-1 |
| `.docx` | ✅ Basic | Text extraction only |
| `.pdf` | ✅ Basic | Requires `pdftotext` (poppler-utils) |

### Installing PDF Support

**macOS:**
```bash
brew install poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**Windows:**
Download Poppler from [official releases](https://github.com/oschwartz10612/poppler-windows/releases/)

---

## 🎨 What Gets Removed?

### 1. Page Numbers
Lines containing only numbers are treated as page markers:
```
1
2
3
```
→ Removed

### 2. Headers & Footers
Common patterns are automatically detected:
- `Page X of Y`
- `Page X`
- `Confidential`
- `DRAFT`
- `CONFIDENTIAL`

### 3. Duplicate Lines
Consecutive identical lines are collapsed:
```
Important line
Important line
Important line
```
→ Becomes:
```
Important line
```

### 4. Empty Lines
Whitespace-only lines are removed:
```
Line 1


Line 2
```
→ Becomes:
```
Line 1
Line 2
```

---

## 📊 Statistics

After processing, DocStripper shows detailed statistics:

```
==================================================
STATISTICS
==================================================
Files processed: 3
Lines removed: 127
Duplicates collapsed: 23
Empty lines removed: 45
Headers/footers removed: 59
==================================================
```

---

## 🔄 Logging & Undo

All operations are logged to `.strip-log` (JSON format) with:
- List of processed files
- Backup file paths
- Detailed statistics
- Timestamps

**Restore from last operation:**
```bash
python tool.py --undo
```

**Backup files** are created with `.bak` extension automatically.

---

## ⚙️ Command Line Options

```bash
python tool.py [OPTIONS] [FILES...]

Options:
  -h, --help     Show help message and exit
  --dry-run      Preview changes without modifying files
  --undo         Restore files from last operation

Examples:
  tool.py document.txt
  tool.py *.txt *.docx
  tool.py --dry-run report.pdf
  tool.py --undo
```

---

## 🚦 Exit Codes

- `0` — Success
- `1` — Error (file not found, read error, etc.)

---

## 🔧 Requirements

- **Python 3.9+** (tested with Python 3.9–3.13)
- **PDF support** (optional): `pdftotext` from poppler-utils

---

## 📝 Limitations

- **DOCX files**: Processed as plain text (formatting may be lost)
- **PDF files**: Requires `pdftotext` to be installed
- **Complex formatting**: May be lost during text extraction

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE.txt](LICENSE.txt) file for details.

---

## 🙏 Acknowledgments

DocStripper is designed to help you clean up messy documents quickly and efficiently.

---

## 📚 Additional Resources

- [Changelog](CHANGELOG.md) — Version history
- [Self Tests](SELF_TESTS.md) — Test cases and examples
- [Release Ledger](RELEASE_LEDGER.json) — Release tracking

---

<div align="center">

**Made with ❤️ for clean documents**

[⭐ Star this repo](https://github.com/kiku-jw/DocStripper2) | [🐛 Report Bug](https://github.com/kiku-jw/DocStripper2/issues) | [💡 Request Feature](https://github.com/kiku-jw/DocStripper2/issues)

</div>
