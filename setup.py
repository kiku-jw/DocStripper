#!/usr/bin/env python3
"""
Setup script for DocStripper PyPI package
"""
from setuptools import setup
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding='utf-8') if readme_file.exists() else ""

# Read version from tool.py (extract __version__ if exists, otherwise use default)
version = "2.1.0"
try:
    tool_file = Path(__file__).parent / "tool.py"
    if tool_file.exists():
        content = tool_file.read_text(encoding='utf-8')
        # Try to find version in comments or use default
        for line in content.split('\n')[:50]:
            if 'version' in line.lower() and ('2.' in line or 'v2' in line.lower()):
                import re
                match = re.search(r'(\d+\.\d+\.\d+)', line)
                if match:
                    version = match.group(1)
                    break
except:
    pass

setup(
    name="docstripper",
    version=version,
    author="Kiku",
    author_email="",  # Add email if needed
    description="AI-powered batch document cleaner - Remove noise from text documents automatically",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/kiku-jw/DocStripper",
    py_modules=["tool"],
    scripts=[],
    entry_points={
        "console_scripts": [
            "docstripper=tool:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Text Processing :: Filters",
        "Topic :: Utilities",
    ],
    python_requires=">=3.9",
    install_requires=[],  # No dependencies - uses only stdlib
    extras_require={
        "pdf": [],  # pdftotext is external dependency
    },
    keywords="document cleaner, text processing, pdf, docx, batch processing",
    project_urls={
        "Bug Reports": "https://github.com/kiku-jw/DocStripper/issues",
        "Source": "https://github.com/kiku-jw/DocStripper",
        "Documentation": "https://github.com/kiku-jw/DocStripper/wiki",
    },
)
