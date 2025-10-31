# FAQ - Frequently Asked Questions

## General Questions

### What is DocStripper?

DocStripper is an AI-powered batch document cleaner that automatically removes noise from text documents, including page numbers, headers, footers, duplicate lines, and empty lines.

### Is DocStripper free?

Yes! DocStripper is completely free and open-source (MIT License).

### Is my data private?

**Absolutely!** All processing happens entirely in your browser (web app) or on your computer (CLI). Your files never leave your device - no uploads, no server-side processing.

### What file formats are supported?

- `.txt` - Plain text files
- `.docx` - Microsoft Word documents  
- `.pdf` - PDF files (CLI only, requires poppler-utils)

## Web Application

### Do I need to install anything?

No! The web application works entirely in your browser. Just visit the website and start using it.

### What browsers are supported?

- Chrome/Edge 113+ (recommended)
- Firefox 110+
- Safari 18+

### What's the difference between Fast Clean and Smart Clean?

- **Fast Clean**: Instant rule-based cleaning using pattern matching
- **Smart Clean**: AI-powered cleaning using on-device LLM (requires WebGPU, slower but more intelligent)

### Why does Smart Clean require a download?

Smart Clean downloads a small AI model (~100-200 MB) to run locally in your browser. This download happens only once and is cached for future use.

### Can I use Smart Clean offline?

Yes! After the initial download, Smart Clean works completely offline.

### What if WebGPU is not available?

The tool will automatically fall back to Fast Clean mode.

## CLI Tool

### Do I need to install Python packages?

No! The CLI tool uses only Python standard library - no external dependencies required (except optional poppler-utils for PDF support).

### How do I install PDF support?

- **macOS**: `brew install poppler`
- **Ubuntu/Debian**: `sudo apt-get install poppler-utils`
- **Windows**: Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)

### Can I undo changes?

Yes! Use `python tool.py --undo` to restore files from the last operation.

### Are my original files backed up?

Yes! Original files are automatically backed up with `.bak` extension before processing.

## Technical Questions

### How does Fast Clean work?

Fast Clean uses pattern matching to identify and remove:
- Page numbers (lines with only digits)
- Headers/footers (common patterns)
- Duplicate consecutive lines
- Empty lines
- Punctuation-only lines

### How does Smart Clean work?

Smart Clean uses an on-device Large Language Model (LLM) to intelligently analyze each line and decide whether to keep, remove, or modify it based on context.

### Can I customize what gets removed?

Yes! Both modes support customizable cleaning options. In Smart Clean mode, unchecked options are preserved in the output.

### What's the maximum file size?

There's no hard limit, but very large files (>10MB) may take longer to process, especially in Smart Clean mode.

## Troubleshooting

### The web app isn't working

- Check your browser version (should be modern)
- Ensure JavaScript is enabled
- Try disabling browser extensions
- Clear browser cache

### Smart Clean is slow

- This is normal for large documents
- Consider using Fast Clean for very large files
- Ensure WebGPU is enabled in your browser

### CLI says "file not found"

- Check the file path is correct
- Ensure you're in the right directory
- Use absolute paths if relative paths don't work

### PDF processing fails

- Ensure poppler-utils is installed
- Check that `pdftotext` is in your PATH
- Verify the PDF file is not corrupted

## Contributing

### How can I contribute?

See our [Contributing Guide](../CONTRIBUTING.md) for details. We welcome:
- Bug reports
- Feature requests
- Code contributions
- Documentation improvements

### Where can I report bugs?

Use the [GitHub Issues](https://github.com/kiku-jw/DocStripper/issues) page and select the "Bug Report" template.

### Can I suggest features?

Absolutely! Use the [Feature Request template](https://github.com/kiku-jw/DocStripper/issues/new?template=feature_request.md).

## Still have questions?

- Check [GitHub Discussions](https://github.com/kiku-jw/DocStripper/discussions)
- Open an [Issue](https://github.com/kiku-jw/DocStripper/issues)
- Visit the [Product Hunt page](https://www.producthunt.com/products/docstripper)
