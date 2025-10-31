# GitHub Actions Workflows

This directory can contain GitHub Actions workflows for automated testing and deployment.

## Example Workflow

Here's a basic CI workflow example (create `.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11', '3.12', '3.13']
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    - name: Run tests
      run: |
        python tool.py --help
        python tool.py --dry-run examples/before_after.txt
```

## GitHub Pages Deployment

GitHub Pages is configured to deploy from the `/docs` folder automatically. No workflow needed!

Just enable Pages in repository settings:
- Settings → Pages → Source: `main` branch, `/docs` folder
