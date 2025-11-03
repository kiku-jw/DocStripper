# Homebrew Tap Setup Instructions

## Quick Setup

1. **Create a new repository on GitHub:**
   - Repository name: `homebrew-docstripper`
   - Make it public
   - Don't initialize with README

2. **Clone and setup locally:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/homebrew-docstripper.git
   cd homebrew-docstripper
   mkdir -p Formula
   ```

3. **Copy and update the formula:**
   ```bash
   cp ../DocStripper/docstripper.rb Formula/docstripper.rb
   ```

4. **Update the formula URL to point to GitHub releases:**
   
   Edit `Formula/docstripper.rb` and update:
   ```ruby
   url "https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz"
   sha256 "" # Calculate with: shasum -a 256 <downloaded_file>
   ```

5. **Calculate SHA256:**
   ```bash
   # Download the release tarball first
   curl -L https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz -o docstripper.tar.gz
   shasum -a 256 docstripper.tar.gz
   # Copy the hash to the formula
   ```

6. **Commit and push:**
   ```bash
   git add Formula/docstripper.rb
   git commit -m "Add docstripper formula"
   git push origin main
   ```

7. **Users can now install with:**
   ```bash
   brew tap YOUR_USERNAME/docstripper
   brew install docstripper
   ```

## Formula Template (for reference)

The formula is already created in `docstripper.rb`. Make sure it has:
- Correct URL pointing to GitHub releases
- Correct SHA256 hash
- Proper dependencies

## Updating the Formula

When releasing a new version:
1. Update the URL to the new release tag
2. Calculate new SHA256 hash
3. Update version in formula
4. Commit and push to tap repo

## Testing

Before pushing, test locally:
```bash
brew install --build-from-source Formula/docstripper.rb
brew test docstripper
```
