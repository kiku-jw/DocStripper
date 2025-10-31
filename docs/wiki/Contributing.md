# Contributing Guide

Thank you for your interest in contributing to DocStripper! 🎉

## How to Contribute

### Reporting Bugs

Found a bug? Please create an issue using the [Bug Report template](https://github.com/kiku-jw/DocStripper/issues/new?template=bug_report.md).

### Suggesting Features

Have an idea? We'd love to hear it! Use the [Feature Request template](https://github.com/kiku-jw/DocStripper/issues/new?template=feature_request.md).

### Good First Issues

Looking for something to start with? Check out issues labeled `good first issue` - these are perfect for new contributors!

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Python 3.9+
- Git
- (Optional) poppler-utils for PDF support

### Setup Steps

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DocStripper.git
   cd DocStripper
   ```

2. Test your changes:
   ```bash
   python tool.py --dry-run examples/before_after.txt
   ```

## Code Style

- Follow PEP 8 style guide
- Use Python 3.9+ features
- Prefer standard library over external packages
- Add docstrings to functions and classes
- Keep functions small and focused

## Testing

- Test your changes with various file types (.txt, .docx, .pdf)
- Use `--dry-run` mode to preview changes
- Test edge cases (empty files, very large files, etc.)

## Documentation

- Update README.md if adding features
- Update CHANGELOG.md for significant changes
- Add comments for complex logic

## Commit Messages

Use clear, descriptive commit messages:
- `feat: Add new feature`
- `fix: Fix bug in XYZ`
- `docs: Update documentation`
- `refactor: Improve code structure`

## Questions?

- Check [GitHub Discussions](https://github.com/kiku-jw/DocStripper/discussions)
- Open an [Issue](https://github.com/kiku-jw/DocStripper/issues)
- Read the [Wiki](https://github.com/kiku-jw/DocStripper/wiki)

Thank you for helping make DocStripper better! 🙏
