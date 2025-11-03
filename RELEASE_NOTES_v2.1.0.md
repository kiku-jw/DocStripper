# DocStripper v2.1.0 - UX & Distribution Release

## 🎯 Major Improvements

### Cleaning Temperament Slider (Web)
Replaced "Conservative" and "Aggressive" radio buttons with an intuitive **4-mode slider**:
- **Gentle (Recommended)**: Safe defaults, preserves formatting
- **Moderate**: Balanced cleaning with line merging
- **Thorough**: Complete cleaning with Unicode normalization, preserves paragraph spacing
- **Aggressive**: Maximum cleaning, removes paragraph spacing for compact output

### Privacy-First UX
- **🔒 Onboarding Tooltip**: First-time visitors see a privacy message ("Everything works offline, nothing sent")
- **📡 Works Offline Badge**: Visual indicator in the UI corner
- **Privacy-Friendly Analytics**: Integrated Plausible.io (no cookies, GDPR-compliant)

### Performance Improvements
- **WebWorker Integration**: Large files (>100KB or >5000 lines) now process in background thread
- **No UI Freezing**: Long PDF processing no longer blocks the interface
- **Smart Mode Selection**: Automatically uses WebWorker for Fast Clean on large files

### Enhanced Feedback
- **✅ ZIP Download Notifications**: Shows "X files cleaned" after batch download
- **Settings Restoration Toast**: Visual confirmation when previous settings are restored
- **Support Snackbar**: Non-intrusive "Buy a coffee" message after cleaning (once per session)

### Distribution Ready
- **Homebrew Tap**: Created `kiku-jw/homebrew-docstripper` repository
- **PyPI Package**: Ready for distribution (`pip install docstripper`)
- **Installation Guides**: Comprehensive docs in `INSTALL.md` and `PUBLISH_GUIDE.md`

### Web Interface Enhancements
- **Normalize Unicode Option**: Added checkbox in Advanced Options (11 options total)
- **Gumroad Support Link**: Added to floating support button, snackbar, and README
- **Improved Mobile Layout**: Better spacing and alignment on small screens

## 🔧 Technical Changes

### Web (`docs/assets/app.js`)
- Refactored cleaning mode selection to temperament slider system
- Implemented `updateTemperamentFromValue()` and `applyTemperamentDefaults()` methods
- Added `cleaner.worker.js` WebWorker for background processing
- Enhanced `normalizeUnicode` option (converts smart quotes, dashes to ASCII)
- Improved settings persistence and restoration UI feedback

### CSS (`docs/assets/style.css`)
- Added responsive styles for temperament slider
- Onboarding tooltip animations and responsive adjustments
- Works offline badge styles with mobile hiding
- Support snackbar animations

### New Files
- `docs/assets/cleaner.worker.js`: WebWorker implementation for cleaning
- `docstripper.rb`: Homebrew formula
- `INSTALL.md`: Installation instructions for all methods
- `PUBLISH_GUIDE.md`: Distribution guide
- `HOMEBREW_TAP_SETUP.md`: Homebrew tap setup instructions

## 🐛 Bug Fixes
- Fixed Thorough vs Aggressive mode differentiation (paragraph spacing preservation)
- Improved temperament slider step values (0, 33, 66, 100 for 4 distinct modes)

## 📊 Cleaning Modes Comparison

| Feature | Gentle | Moderate | Thorough | Aggressive |
|---------|--------|----------|----------|-----------|
| Page numbers | ✅ | ✅ | ✅ | ✅ |
| Headers/footers | ✅ | ✅ | ✅ | ✅ |
| Duplicates | ✅ | ✅ | ✅ | ✅ |
| Hyphenation fix | ✅ | ✅ | ✅ | ✅ |
| Line merging | ❌ | ✅ | ✅ | ✅ |
| Whitespace norm | ❌ | ❌ | ✅ | ✅ |
| Unicode norm | ❌ | ❌ | ✅ | ✅ |
| Paragraph spacing | ✅ | ✅ | ✅ | ❌ |

## 🛠️ Installation

### Web
No installation needed: https://kiku-jw.github.io/DocStripper/

### CLI - Homebrew (macOS)
```bash
brew tap kiku-jw/docstripper
brew install docstripper
docstripper document.txt
```

### CLI - PyPI (All Platforms)
```bash
pip install docstripper
docstripper document.txt
```

### CLI - Manual
```bash
git clone https://github.com/kiku-jw/DocStripper.git
cd DocStripper
python tool.py document.txt
```

## 🙏 Support

If DocStripper saves you time, consider supporting the project:
- ☕ [Buy a coffee on Gumroad](https://kiku0.gumroad.com/coffee)

## 📚 Documentation

- Updated README with cleaning temperament descriptions
- Wiki Usage guide updated
- Comprehensive installation guide (`INSTALL.md`)

---

**Full Changelog**: See [GitHub Commits](https://github.com/kiku-jw/DocStripper/compare/v2.0.0...v2.1.0)

