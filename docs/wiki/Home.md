# DocStripper - Batch Document Cleaner

**DocStripper** automatically removes noise from text documents. Clean your `.txt`, `.docx`, and `.pdf` files with intelligent rule-based processing.

## 🌐 [Try it Online](https://kiku-jw.github.io/DocStripper/) - No installation needed!

## ✨ Key Features

### Cleaning Pipeline v2.0
- **Line Merging**: Automatically merges broken lines mid-sentence
- **De-hyphenation**: Fixes words split across line breaks
- **Header/Footer Removal**: Removes page numbers, "Page X of Y", repeating headers/footers
- **Whitespace Normalization**: Collapses spaces, normalizes tabs
- **Unicode Normalization**: Converts smart quotes and dashes to ASCII

### Protection Mechanisms
- ✅ **Lists**: Never merged (bullet points, numbered lists)
- ✅ **Tables**: Detected and preserved (spacing maintained)
- ✅ **Headers**: Protected from being merged with content

### Modes
- **Fast Clean**: Instant rule-based cleaning (recommended)
- **Smart Clean (Beta)**: AI-powered with on-device LLM
- **Conservative Mode**: Safe defaults
- **Aggressive Mode**: More thorough cleaning

## 🚀 Quick Start

### Web App
1. Visit https://kiku-jw.github.io/DocStripper/
2. Upload your files (.txt, .docx, .pdf)
3. Click "Start Cleaning"
4. Download or copy results

### CLI
```bash
# Install
git clone https://github.com/kiku-jw/DocStripper.git
cd DocStripper

# Clean a file
python tool.py document.txt

# Pipe stdin to stdout
cat file.pdf | python tool.py - --stdout > clean.txt
```

## 📖 What Gets Removed?

### Default (Conservative)
- Page numbers (1, 2, 3...)
- Headers/footers ("Page X of Y", "Confidential", etc.)
- Repeating headers/footers across pages
- Duplicate lines
- Empty lines
- Punctuation-only lines (---, ***, ===)
- Hyphenation fixed (auto-\nmatic → automatic)

### Aggressive Mode
All default features plus:
- Merges broken lines
- Normalizes whitespace

## 🔒 Privacy

100% private - All processing happens in your browser. Files never leave your computer.

## 📚 Documentation

- [Installation](Installation) - Setup instructions
- [Usage](Usage) - Detailed usage guide
- [FAQ](FAQ) - Common questions
- [Contributing](Contributing) - How to contribute

## 📝 License

MIT License - See [LICENSE.txt](https://github.com/kiku-jw/DocStripper/blob/main/LICENSE.txt)

