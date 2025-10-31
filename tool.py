#!/usr/bin/env python3
"""
DocStripper - Batch document cleaner
Removes noise from text documents: page headers, footers, duplicates, etc.
"""

import sys
import os
import re
import json
import argparse
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
from hashlib import sha1
from typing import List, Tuple, Optional


class DocStripper:
    """Main class for document cleaning operations."""
    
    # Patterns for common headers/footers
    HEADER_PATTERNS = [
        r'^Page\s+\d+\s+of\s+\d+$',
        r'^\d+\s+of\s+\d+$',
        r'^Page\s+\d+$',
        r'^Confidential$',
        r'^DRAFT$',
        r'^CONFIDENTIAL$',
        r'^Draft$',
        # Compound headers with dashes
        r'^CONFIDENTIAL\s*-\s*INTERNAL\s+USE\s+ONLY$',
        r'^Confidential\s*-\s*Internal\s+Use\s+Only$',
        r'^DRAFT\s*-\s*NOT\s+FOR\s+DISTRIBUTION$',
        r'^Draft\s*-\s*Not\s+for\s+Distribution$',
        r'^INTERNAL\s+USE\s+ONLY$',
        r'^Internal\s+Use\s+Only$',
        r'^FOR\s+INTERNAL\s+USE\s+ONLY$',
        r'^FOR\s+INTERNAL\s+USE$',
    ]
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.log_file = Path('.strip-log')
        self.stats = {
            'files_processed': 0,
            'lines_removed': 0,
            'duplicates_collapsed': 0,
            'empty_lines_removed': 0,
            'header_footer_removed': 0,
            'punctuation_lines_removed': 0,
        }
        self.undo_data = []
    
    def extract_text_from_pdf(self, file_path: Path) -> Optional[str]:
        """Extract text from PDF using pdftotext if available."""
        if shutil.which('pdftotext'):
            try:
                result = subprocess.run(
                    ['pdftotext', '-layout', str(file_path), '-'],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0:
                    return result.stdout
            except (subprocess.TimeoutExpired, FileNotFoundError):
                pass
        
        # Fallback: try antiword-style approach or return None
        print(f"Warning: Could not extract text from PDF {file_path}. "
              f"Install pdftotext (poppler-utils) for PDF support.", file=sys.stderr)
        return None
    
    def extract_text_from_docx(self, file_path: Path) -> Optional[str]:
        """Extract text from DOCX using basic XML parsing (stdlib only)."""
        try:
            import xml.etree.ElementTree as ET
            import zipfile
            
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                # Read main document XML
                xml_content = zip_ref.read('word/document.xml')
                root = ET.fromstring(xml_content)
                
                # Extract text from all text nodes
                # DOCX uses namespace, we'll handle it simply
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                text_parts = []
                
                for elem in root.iter():
                    if elem.tag.endswith('}t'):  # text element
                        if elem.text:
                            text_parts.append(elem.text)
                
                return '\n'.join(text_parts)
        except Exception as e:
            print(f"Warning: Could not extract text from DOCX {file_path}: {e}", file=sys.stderr)
            return None
    
    def read_text_file(self, file_path: Path) -> Optional[str]:
        """Read text from various file formats."""
        suffix = file_path.suffix.lower()
        
        if suffix == '.txt':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except UnicodeDecodeError:
                try:
                    with open(file_path, 'r', encoding='latin-1') as f:
                        return f.read()
                except Exception as e:
                    print(f"Error reading {file_path}: {e}", file=sys.stderr)
                    return None
            except Exception as e:
                print(f"Error reading {file_path}: {e}", file=sys.stderr)
                return None
        
        elif suffix == '.pdf':
            return self.extract_text_from_pdf(file_path)
        
        elif suffix == '.docx':
            return self.extract_text_from_docx(file_path)
        
        else:
            print(f"Unsupported file type: {suffix}", file=sys.stderr)
            return None
    
    def is_page_number(self, line: str) -> bool:
        """Check if line contains only numbers (page markers)."""
        stripped = line.strip()
        if not stripped:
            return False
        # Check if it's only digits (possibly with spaces or punctuation)
        return bool(re.match(r'^\s*\d+\s*$', stripped))
    
    def is_punctuation_only(self, line: str) -> bool:
        """Check if line contains only punctuation characters."""
        stripped = line.strip()
        if not stripped:
            return False
        # Lines with only punctuation: ---, ***, ===, etc.
        # Match non-word, non-space characters, max 50 chars
        return bool(re.match(r'^[^\w\s]+$', stripped)) and len(stripped) <= 50
    
    def is_header_footer(self, line: str) -> bool:
        """Check if line matches common header/footer patterns."""
        stripped = line.strip()
        for pattern in self.HEADER_PATTERNS:
            if re.match(pattern, stripped, re.IGNORECASE):
                return True
        return False
    
    def clean_text(self, text: str) -> Tuple[str, dict]:
        """Clean text by removing noise."""
        if not text:
            return "", {}
        
        lines = text.split('\n')
        cleaned_lines = []
        prev_line = None
        local_stats = {
            'lines_removed': 0,
            'duplicates_collapsed': 0,
            'empty_lines_removed': 0,
            'header_footer_removed': 0,
            'punctuation_lines_removed': 0,
        }
        
        for line in lines:
            original_line = line
            stripped = line.strip()
            
            # Skip empty or whitespace-only lines
            if not stripped:
                local_stats['empty_lines_removed'] += 1
                continue
            
            # Skip punctuation-only lines (---, ***, ===, etc.)
            if self.is_punctuation_only(stripped):
                local_stats['punctuation_lines_removed'] += 1
                continue
            
            # Skip page numbers
            if self.is_page_number(stripped):
                local_stats['header_footer_removed'] += 1
                continue
            
            # Skip headers/footers
            if self.is_header_footer(stripped):
                local_stats['header_footer_removed'] += 1
                continue
            
            # Skip consecutive duplicates
            if prev_line is not None and stripped == prev_line.strip():
                local_stats['duplicates_collapsed'] += 1
                continue
            
            cleaned_lines.append(line)
            prev_line = line
        
        cleaned_text = '\n'.join(cleaned_lines)
        local_stats['lines_removed'] = len(lines) - len(cleaned_lines)
        
        return cleaned_text, local_stats
    
    def process_file(self, file_path: Path) -> bool:
        """Process a single file."""
        if not file_path.exists():
            print(f"Error: File not found: {file_path}", file=sys.stderr)
            return False
        
        print(f"Processing: {file_path}")
        
        # Read text
        text = self.read_text_file(file_path)
        if text is None:
            return False
        
        # Clean text
        cleaned_text, stats = self.clean_text(text)
        
        # Update global stats
        self.stats['files_processed'] += 1
        self.stats['lines_removed'] += stats['lines_removed']
        self.stats['duplicates_collapsed'] += stats['duplicates_collapsed']
        self.stats['empty_lines_removed'] += stats['empty_lines_removed']
        self.stats['header_footer_removed'] += stats['header_footer_removed']
        self.stats['punctuation_lines_removed'] += stats.get('punctuation_lines_removed', 0)
        
        # Show what would be changed
        if text != cleaned_text:
            print(f"  - Lines removed: {stats['lines_removed']}")
            print(f"  - Duplicates collapsed: {stats['duplicates_collapsed']}")
            print(f"  - Empty lines removed: {stats['empty_lines_removed']}")
            print(f"  - Headers/footers removed: {stats['header_footer_removed']}")
            if stats.get('punctuation_lines_removed', 0) > 0:
                print(f"  - Punctuation lines removed: {stats['punctuation_lines_removed']}")
        
        # Save original for undo
        if not self.dry_run:
            backup_path = file_path.with_suffix(file_path.suffix + '.bak')
            try:
                with open(file_path, 'rb') as src, open(backup_path, 'wb') as dst:
                    dst.write(src.read())
                
                # Write cleaned text
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned_text)
                
                # Log operation
                self.undo_data.append({
                    'file': str(file_path),
                    'backup': str(backup_path),
                    'timestamp': datetime.now().isoformat(),
                    'stats': stats
                })
                
                print(f"  ✓ Saved (backup: {backup_path.name})")
            except Exception as e:
                print(f"Error writing {file_path}: {e}", file=sys.stderr)
                return False
        else:
            print(f"  [DRY RUN] Would clean {file_path}")
        
        return True
    
    def save_log(self):
        """Save operation log for undo capability."""
        if not self.dry_run and self.undo_data:
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'operations': self.undo_data,
                'stats': self.stats
            }
            
            # Append to log file
            log_entries = []
            if self.log_file.exists():
                try:
                    with open(self.log_file, 'r', encoding='utf-8') as f:
                        log_entries = json.load(f)
                except:
                    log_entries = []
            
            log_entries.append(log_entry)
            
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(log_entries, f, indent=2, ensure_ascii=False)
    
    def print_stats(self):
        """Print final statistics."""
        print("\n" + "="*50)
        print("STATISTICS")
        print("="*50)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Lines removed: {self.stats['lines_removed']}")
        print(f"Duplicates collapsed: {self.stats['duplicates_collapsed']}")
        print(f"Empty lines removed: {self.stats['empty_lines_removed']}")
        print(f"Headers/footers removed: {self.stats['header_footer_removed']}")
        if self.stats.get('punctuation_lines_removed', 0) > 0:
            print(f"Punctuation lines removed: {self.stats['punctuation_lines_removed']}")
        if not self.dry_run:
            print(f"\nLog saved to: {self.log_file}")
            print("Backup files created with .bak extension")
        print("="*50)


def undo_last_operation():
    """Restore files from last operation using log."""
    log_file = Path('.strip-log')
    if not log_file.exists():
        print("No log file found. Nothing to undo.", file=sys.stderr)
        return False
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            log_entries = json.load(f)
        
        if not log_entries:
            print("Log file is empty. Nothing to undo.", file=sys.stderr)
            return False
        
        last_entry = log_entries[-1]
        operations = last_entry.get('operations', [])
        
        if not operations:
            print("No operations in last log entry.", file=sys.stderr)
            return False
        
        print(f"Restoring {len(operations)} file(s) from {last_entry['timestamp']}...")
        
        restored = 0
        for op in operations:
            backup_path = Path(op['backup'])
            file_path = Path(op['file'])
            
            if backup_path.exists():
                try:
                    with open(backup_path, 'rb') as src, open(file_path, 'wb') as dst:
                        dst.write(src.read())
                    print(f"  ✓ Restored: {file_path}")
                    restored += 1
                except Exception as e:
                    print(f"  ✗ Error restoring {file_path}: {e}", file=sys.stderr)
            else:
                print(f"  ✗ Backup not found: {backup_path}", file=sys.stderr)
        
        # Remove last entry from log
        log_entries.pop()
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_entries, f, indent=2, ensure_ascii=False)
        
        print(f"\nRestored {restored} file(s).")
        return True
        
    except Exception as e:
        print(f"Error reading log file: {e}", file=sys.stderr)
        return False


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='DocStripper - Batch document cleaner. Removes noise from text documents.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s document.txt
  %(prog)s *.txt *.docx
  %(prog)s --dry-run report.pdf
  %(prog)s --undo
        """
    )
    
    parser.add_argument(
        'files',
        nargs='*',
        help='Files to process (.txt, .docx, .pdf)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without modifying files'
    )
    
    parser.add_argument(
        '--undo',
        action='store_true',
        help='Restore files from last operation'
    )
    
    args = parser.parse_args()
    
    # Handle undo
    if args.undo:
        success = undo_last_operation()
        sys.exit(0 if success else 1)
    
    # Check for files
    if not args.files:
        parser.print_help()
        sys.exit(1)
    
    # Process files
    stripper = DocStripper(dry_run=args.dry_run)
    success_count = 0
    
    for file_pattern in args.files:
        file_path = Path(file_pattern)
        
        if file_path.exists():
            if stripper.process_file(file_path):
                success_count += 1
        else:
            print(f"Warning: File not found: {file_path}", file=sys.stderr)
    
    # Save log
    stripper.save_log()
    
    # Print statistics
    stripper.print_stats()
    
    # Exit with appropriate code
    if success_count == 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
