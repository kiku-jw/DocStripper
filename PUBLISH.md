# PUBLISHING INSTRUCTIONS

## Steps to publish on GitHub:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `DocStripper`
   - Description: "Batch document cleaner — removes noise from text documents"
   - Select Public
   - DO NOT add README, .gitignore or license (they already exist)
   - Click "Create repository"

2. **Connect local repository to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/DocStripper.git
   git branch -M main
   git push -u origin main
   ```
   (Replace YOUR_USERNAME with your GitHub username)

3. **Create v1.0.0 release:**
   - Go to Releases section on GitHub
   - Click "Create a new release"
   - Tag: `v1.0.0`
   - Release title: `DocStripper — Batch document cleaner`
   - Description:
     ```
     ## DocStripper v1.0.0
     
     First release of DocStripper — utility for batch cleaning text documents.
     
     ### Main features:
     - Remove duplicate lines
     - Remove page numbers
     - Remove headers and footers
     - Remove empty lines
     - Support for .txt, .docx, .pdf files
     - Dry-run mode
     - Undo changes
     
     ### Technical details:
     - Python 3.9+
     - Standard library only
     - Cross-platform support
     
     See README.md for installation and usage instructions.
     ```
   - Click "Publish release"

4. **Verify everything works:**
   ```bash
   python tool.py --help
   ```

## Project structure:

```
DocStripper/
├── tool.py              # Main utility file
├── README.md            # Documentation with examples
├── CHANGELOG.md         # Change history
├── LICENSE.txt          # MIT License
├── SELF_TESTS.md        # Test cases
├── RELEASE_LEDGER.json  # Release registry
├── .gitignore          # Git ignore file
└── examples/
    └── before_after.txt # Demonstration
```

## Readiness check:

✅ All files created
✅ Git repository initialized
✅ tool.py works correctly
✅ README contains 6 usage examples
✅ Ready to publish!
