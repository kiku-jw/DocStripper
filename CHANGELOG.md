# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-XX

### Added
- 🤖 **Smart Clean (Beta)** - AI-powered cleaning using on-device LLM (WebLLM)
  - WebGPU-based inference for fast processing
  - Dynamic prompt generation based on user settings
  - Automatic fallback to Fast Clean if WebGPU unavailable
  - Progress tracking and cancellation support
  - Batch processing for large files (parallel chunk processing)
  - Adaptive chunk sizing for optimal performance
- 🏷️ **Mode Badges** - Visual indicators showing which cleaning mode was used
- 📈 **Enhanced Statistics** - Detailed breakdown of what was removed
- 📝 **Improved Prompts** - Better examples and instructions for LLM

### Improved
- ⚡ **Performance Optimization** - Parallel batch processing for Smart Clean
- 🎯 **Better Error Handling** - Fallback mechanisms for failed chunks
- 📊 **Adaptive Chunking** - Dynamic chunk size based on document length
- 🔧 **Settings Integration** - Cleaning options now customize AI behavior in Smart mode

### Technical
- WebLLM integration with dynamic model loading
- Cache API support for model weights (planned)
- Improved JSON parsing with markdown code block support
- Enhanced progress tracking for long operations

## [1.1.0] - 2025-01-XX

### Added
- 🌐 **Web Application** - Interactive web interface hosted on GitHub Pages
- ⚙️ **Customizable Cleaning Options** - Configurable settings for each cleaning type
- 🎨 **Dark Theme Support** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **Manual Start Workflow** - Upload → Configure → Start → Results workflow
- 📊 **Real-time Statistics** - Live statistics showing what was removed
- 🚀 **Enhanced Page Number Detection** - Support for Roman numerals (I, II, III) and letters (A, B, C)
- 🔤 **Punctuation Line Removal** - Remove lines with only symbols (---, ***, ===)
- 📝 **Paragraph Spacing Preservation** - Option to keep one empty line between paragraphs
- 🌍 **Multi-language Header Patterns** - Support for Spanish and Russian page headers
- 📥 **Download Functionality** - Download cleaned files with proper naming
- 📋 **Copy to Clipboard** - Quick copy functionality for cleaned text

### Improved
- Better header/footer pattern detection (INTERNAL USE ONLY, PROPRIETARY, etc.)
- Enhanced user experience with smooth scrolling and visual feedback
- Improved Chrome compatibility for file input
- Better error handling and user feedback

### Technical
- Client-side processing using JavaScript (FileReader API, JSZip)
- No server-side processing - 100% privacy
- Cache-busting for reliable updates
- Automatic copyright year update

## [1.0.0] - 2024-12-20

### Added
- Initial release of DocStripper CLI tool
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
