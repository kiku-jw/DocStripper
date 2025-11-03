# Homebrew Tap Setup Instructions

## ✅ Tap Repository Created!

The Homebrew tap repository has been created at: **https://github.com/kiku-jw/homebrew-docstripper**

The formula is already set up and ready. However, you need to create a GitHub release tag before users can install it.

## Next Steps

### Step 1: Create GitHub Release Tag

Before users can install via Homebrew, you need a tagged release:

```bash
# In DocStripper repo
git tag v2.1.0
git push origin v2.1.0
```

Then create a GitHub release at: https://github.com/kiku-jw/DocStripper/releases/new
- Tag: v2.1.0
- Title: v2.1.0
- Description: (optional)

### Step 2: Update Formula with Release SHA256

After creating the release, you need to calculate the SHA256 hash and update the formula:

```bash
# Download the release tarball
curl -L https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz -o docstripper.tar.gz

# Calculate hash
shasum -a 256 docstripper.tar.gz
# Copy the hash (first part before spaces, without filename)
```

Then update the formula in the tap repository:

```bash
# Clone the tap repo (if not already)
git clone https://github.com/kiku-jw/homebrew-docstripper.git
cd homebrew-docstripper

# Edit Formula/docstripper.rb and update:
# 1. URL should already be correct: url "https://github.com/kiku-jw/DocStripper/archive/refs/tags/v2.1.0.tar.gz"
# 2. Update SHA256: sha256 "PASTE_HASH_HERE"

# Commit and push
git add Formula/docstripper.rb
git commit -m "Update formula with release SHA256"
git push origin main
```

### Step 3: Test Installation

```bash
# Test locally
brew tap kiku-jw/docstripper
brew install docstripper

# Verify it works
docstripper --help
```

### Step 4: Users Can Now Install

Once the release is created and SHA256 is updated, users can install with:

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