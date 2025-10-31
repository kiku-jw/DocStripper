# Frequently Asked Questions (FAQ)

## General Questions

### What is DocStripper?

DocStripper is a command-line tool that automatically cleans text documents by removing noise like page numbers, headers, footers, duplicate lines, and empty lines.

### Is DocStripper free?

Yes! DocStripper is open-source and released under the MIT License.

### Does DocStripper send my data anywhere?

No! DocStripper works completely offline. All processing happens locally on your computer.

### What operating systems are supported?

DocStripper works on Windows, macOS, and Linux. It requires Python 3.9 or higher.

## Installation

### Do I need to install anything?

You only need Python 3.9+. DocStripper uses only Python's standard library, so no additional packages are required.

### What about PDF support?

PDF support requires `pdftotext` from poppler-utils. This is optional - DocStripper will still work for `.txt` and `.docx` files without it.

## Usage

### Will DocStripper delete my original files?

No! DocStripper creates backup files (`.bak`) automatically before making changes. You can restore originals using `--undo`.

### Can I preview changes before applying them?

Yes! Use `--dry-run` to see what would be changed without modifying files.

### How do I undo changes?

Use `python tool.py --undo` to restore files from the last operation.

### Can I process multiple files at once?

Yes! You can specify multiple files:
```bash
python tool.py file1.txt file2.txt file3.docx
```

Or use wildcards:
```bash
python tool.py *.txt
```

## Technical Questions

### Why does my PDF file not work?

PDF support requires `pdftotext` to be installed. See the README for installation instructions for your operating system.

### Why are DOCX files processed as plain text?

DocStripper focuses on text cleaning, not formatting preservation. Complex formatting may be lost during extraction.

### What encodings are supported?

DocStripper supports UTF-8 and Latin-1 encodings for text files.

### Where are logs stored?

Operation logs are stored in `.strip-log` in JSON format in the current directory.

## Troubleshooting

### DocStripper says "File not found"

Make sure the file path is correct and the file exists. Check spelling and path separators (`/` on Unix, `\` on Windows).

### Nothing happens when I run DocStripper

Make sure you're providing file arguments:
```bash
python tool.py document.txt
```

Without arguments, DocStripper shows help information.

### Can I customize what gets removed?

Currently, DocStripper uses predefined patterns. Future versions may include customization options.

---

Have more questions? [Open an issue](https://github.com/kiku-jw/DocStripper2/issues)!

