# Usage Guide

## Web Application

### Quick Start

1. Visit https://kikuai-lab.github.io/DocStripper/
2. Click "Upload Your Documents" or drag & drop files
3. Choose cleaning mode:
   - **Fast Clean**: Instant rule-based cleaning
   - **Smart Clean**: AI-powered cleaning (requires WebGPU)
4. Configure cleaning options
5. Click "Start Cleaning"
6. Download or copy the cleaned results

### Cleaning Modes

#### Fast Clean
- **Speed**: Instant
- **Method**: Rule-based pattern matching
- **Best for**: Standard documents with predictable patterns

#### Smart Clean (Beta)
- **Speed**: Slower (depends on document size)
- **Method**: AI-powered with on-device LLM
- **Requirements**: WebGPU support, ~100-200 MB one-time download
- **Best for**: Complex documents with unusual patterns

### Cleaning Options

- **Remove Empty Lines**: Removes blank and whitespace-only lines
- **Remove Page Numbers**: Removes lines with only digits (1, 2, 3...)
- **Remove Headers/Footers**: Removes common patterns (Page X of Y, Confidential, etc.)
- **Remove Duplicates**: Collapses consecutive identical lines
- **Remove Punctuation Lines**: Removes lines with only symbols (---, ***, ===)
- **Preserve Paragraph Spacing**: Keeps one empty line between paragraphs

## CLI Tool

### Basic Usage

```bash
# Clean a single file
python tool.py document.txt

# Clean multiple files
python tool.py file1.txt file2.txt file3.docx

# Preview changes without modifying files
python tool.py --dry-run document.txt

# Undo last operation
python tool.py --undo
```

### Supported Formats

- `.txt` - Plain text files
- `.docx` - Microsoft Word documents
- `.pdf` - PDF files (requires poppler-utils)

### Command Options

```bash
python tool.py [OPTIONS] [FILES...]

Options:
  -h, --help     Show help message
  --dry-run      Preview changes without modifying files
  --undo         Restore files from last operation
  --stdout       Write cleaned text to stdout (no file writes)
  --keep-headers Keep headers/footers/page numbers
  --no-merge-lines        Disable merging broken lines
  --no-dehyphenate        Disable de-hyphenation across line breaks
  --no-normalize-ws       Disable whitespace normalization
  --no-normalize-unicode  Disable Unicode punctuation normalization
```

### Examples

#### Example 1: Clean a single document
```bash
python tool.py report.txt
```

#### Example 2: Clean multiple documents
```bash
python tool.py document1.txt document2.docx document3.pdf
```

#### Example 3: Preview before cleaning
```bash
python tool.py --dry-run important_document.txt
```

#### Example 4: Undo last operation
```bash
python tool.py --undo
```

#### Example 5: Use stdin/stdout
```bash
cat report.pdf | python tool.py - --stdout > report.txt
```

### Output

- Original files are backed up with `.bak` extension
- Processed files replace originals
- Statistics are shown in console
- Operation log saved to `.strip-log`

## Best Practices

1. **Always test on copies first** - Use `--dry-run` or test on copies
2. **Backup important files** - The tool creates backups, but extra backups never hurt
3. **Review statistics** - Check what was removed before finalizing
4. **Use appropriate mode** - Fast Clean for simple documents, Smart Clean for complex ones

## Troubleshooting

See [Troubleshooting Guide](Troubleshooting) for common issues and solutions.
