# Homebrew Tap Setup Instructions

## Quick Setup (Step-by-Step)

### Step 1: Create Tap Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `homebrew-docstripper`
3. Make it **public**
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

### Step 2: Clone and Setup Locally

```bash
git clone https://github.com/kiku-jw/homebrew-docstripper.git
cd homebrew-docstripper
mkdir -p Formula
```

### Step 3: Copy Formula

```bash
# From DocStripper repo root
cp docstripper.rb Formula/docstripper.rb
cd Formula
```

### Step 4: Create GitHub Release (if not exists)

You need a tagged release for Homebrew. If you don't have v2.1.0 release yet:

```bash
# In DocStripper repo
git tag v2.1.0
git push origin v2.1.0
```

Then create a GitHub release at: https://github.com/kiku-jw/DocStripper/releases/new
- Tag: v2.1.0
- Title: v2.1.0
- Description: (can be empty)

### Step 5: Update Formula URL

Edit `Formula/docstripper.rb` and update to point to the release:

```ruby
url "https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz"
```

### Step 6: Calculate SHA256 Hash

```bash
# Download the release tarball
curl -L https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz -o docstripper.tar.gz

# Calculate hash
shasum -a 256 docstripper.tar.gz
# Copy the hash (first part before spaces)
```

Update the formula:
```ruby
sha256 "PASTE_HASH_HERE"
```

### Step 7: Commit and Push

```bash
cd ..  # Back to tap repo root
git add Formula/docstripper.rb
git commit -m "Add docstripper formula"
git push origin main
```

### Step 8: Test Installation

```bash
# Test locally first
brew install --build-from-source Formula/docstripper.rb

# If successful, users can now install with:
brew tap kiku-jw/docstripper
brew install docstripper
```

### Step 9: Update INSTALL.md and README

Update installation instructions to mention the tap:
```bash
brew tap kiku-jw/docstripper
brew install docstripper
```

## Updating the Formula

When releasing a new version:
1. Update the URL to the new release tag
2. Calculate new SHA256 hash
3. Update version in formula
4. Commit and push to tap repo

## Troubleshooting

**Formula fails to install:**
- Check URL is accessible
- Verify SHA256 hash matches
- Ensure dependencies are correct
- Test locally: `brew install --build-from-source Formula/docstripper.rb`

**Formula audit:**
```bash
brew audit --strict Formula/docstripper.rb
```