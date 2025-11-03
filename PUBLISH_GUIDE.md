# Publishing Guide - PyPI and Homebrew

## PyPI Publication

### Prerequisites
```bash
pip install twine build
```

### Step 1: Prepare Package
```bash
# Update version in setup.py if needed
python setup.py check

# Build distributions
python -m build
```

### Step 2: Test Locally (Optional)
```bash
# Install from local build
pip install dist/docstripper-*.whl --force-reinstall

# Test
docstripper --help
```

### Step 3: Upload to PyPI

**Test PyPI (recommended first):**
```bash
# Upload to TestPyPI first
twine upload --repository testpypi dist/*

# Test installation
pip install --index-url https://test.pypi.org/simple/ docstripper
```

**Production PyPI:**
```bash
# Upload to production PyPI
twine upload dist/*

# Install from PyPI
pip install docstripper
```

**Note:** You'll need PyPI credentials. Create account at https://pypi.org/account/register/

### Step 4: Verify
```bash
pip install docstripper
docstripper --help
```

## Homebrew Publication

### Option 1: Homebrew Core (Official Tap)

**Requirements:**
- Repo must have 75+ stars OR 30+ forks
- Must have 30+ days of history
- Must have tagged releases

**Steps:**
1. Create a release tag:
   ```bash
   git tag v2.1.0
   git push origin v2.1.0
   ```

2. Create GitHub release with notes

3. Submit PR to homebrew-core:
   ```bash
   # Fork homebrew-core
   # Create formula in Formula/docstripper.rb
   # Submit PR
   ```

**Formula template for homebrew-core:**
```ruby
class Docstripper < Formula
  desc "AI-powered batch document cleaner"
  homepage "https://github.com/kiku-jw/DocStripper"
  url "https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz"
  sha256 "" # Calculate with: shasum -a 256 <file>
  license "MIT"

  depends_on "python@3.9"

  def install
    system "python3", "-m", "pip", "install", *std_pip_args, "."
  end

  test do
    system "#{bin}/docstripper", "--help"
  end
end
```

### Option 2: Custom Tap (Easier)

**Create your own tap:**

1. Create new repo: `homebrew-docstripper` (or your username)

2. Add formula:
   ```bash
   mkdir -p homebrew-docstripper/Formula
   cp docstripper.rb homebrew-docstripper/Formula/docstripper.rb
   ```

3. Update formula URL to point to releases:
   ```ruby
   url "https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz"
   ```

4. Commit and push:
   ```bash
   cd homebrew-docstripper
   git add Formula/docstripper.rb
   git commit -m "Add docstripper formula"
   git push
   ```

5. Users install with:
   ```bash
   brew tap kiku-jw/docstripper
   brew install docstripper
   ```

### Option 3: Install from Local File (Current)

Users can install directly:
```bash
brew install --build-from-source docstripper.rb
```

## GitHub Releases

### Create Release

1. **Tag the release:**
   ```bash
   git tag -a v2.1.0 -m "Release v2.1.0: UX enhancements and distribution support"
   git push origin v2.1.0
   ```

2. **Create release on GitHub:**
   - Go to https://github.com/kiku-jw/DocStripper/releases/new
   - Select tag: v2.1.0
   - Title: "v2.1.0 - UX Enhancements & Distribution Support"
   - Description: Use RELEASE_NOTES_v2.1.0.md content
   - Upload files if needed (distributions)

## Recommended Order

1. ✅ **GitHub Release** - Tag and create release notes
2. ✅ **PyPI** - Upload to TestPyPI first, then production
3. ✅ **Homebrew Tap** - Create custom tap (easiest) or submit to homebrew-core (if qualified)

## Quick Reference

**PyPI:**
```bash
python -m build
twine upload dist/*  # or --repository testpypi for testing
```

**Homebrew Tap:**
```bash
# Create tap repo, add formula, users install with:
brew tap username/tap-name
brew install package-name
```

**GitHub:**
```bash
git tag v2.1.0
git push origin v2.1.0
# Then create release via GitHub web interface
```

## Troubleshooting

**PyPI upload fails:**
- Check version number (must be unique and incrementing)
- Ensure dist/ folder has .whl and .tar.gz files
- Verify credentials with `twine check dist/*`

**Homebrew installation fails:**
- Check URL is accessible
- Verify SHA256 hash matches
- Ensure dependencies are correct
- Check formula syntax with `brew audit --strict Formula/docstripper.rb`

---
For detailed installation instructions, see [INSTALL.md](INSTALL.md)
