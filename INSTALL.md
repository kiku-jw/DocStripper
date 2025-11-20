# Installation Guide

## PyPI Installation

```bash
pip install docstripper
```

After installation, use:
```bash
docstripper document.txt
```

## Homebrew Installation

**Recommended: Install from Tap**

```bash
brew tap KikuAI-Lab/docstripper
brew install docstripper
```

**Alternative: Install from Local Formula**

```bash
brew install --build-from-source docstripper.rb
```

After installation, use:
```bash
docstripper document.txt
```

## Manual Installation

```bash
# Clone repository
git clone https://github.com/KikuAI-Lab/DocStripper.git
cd DocStripper

# Make executable (optional, for direct usage)
chmod +x tool.py

# Use directly
python tool.py document.txt

# Or create symlink
sudo ln -s $(pwd)/tool.py /usr/local/bin/docstripper
```

## Requirements

- Python 3.9 or higher
- For PDF support (optional): `pdftotext` from poppler-utils
  - macOS: `brew install poppler`
  - Ubuntu/Debian: `sudo apt-get install poppler-utils`
  - Windows: Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)

## Verification

Run the self-test script:
```bash
python scripts/self_test.py
```
