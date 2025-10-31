<!--
.github/workflows is a special directory for GitHub Actions.
This file shows a basic CI workflow example.
-->

# GitHub Actions Workflow Example

This repository can use GitHub Actions for automated testing. Here's a basic example:

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

This is just an example. You can add this workflow by creating `.github/workflows/ci.yml`.

