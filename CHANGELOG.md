# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-20

### Added
- Initial release of DocStripper
- Support for `.txt`, `.docx`, and `.pdf` files
- Automatic removal of duplicate consecutive lines
- Page number detection and removal
- Header/footer pattern matching (Page X of Y, Confidential, DRAFT)
- Empty line removal
- Dry-run mode for previewing changes
- Operation logging system (`.strip-log`)
- Undo functionality (`--undo`)
- Detailed processing statistics
- Automatic backup file creation (`.bak`)
- UTF-8 and Latin-1 encoding support
- Comprehensive error handling with clear messages
- CLI help system (`--help`)

### Technical Details
- Uses only Python 3.9+ standard library
- PDF extraction via `pdftotext` (subprocess) with graceful fallback
- DOCX extraction using `zipfile` + `xml.etree.ElementTree`
- Cross-platform support (Windows, macOS, Linux)
