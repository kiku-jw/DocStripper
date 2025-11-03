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
    
    def __init__(self, dry_run: bool = False,
                 merge_lines: bool = True,
                 dehyphenate: bool = True,
                 normalize_ws: bool = True,
                 normalize_unicode: bool = True,
                 remove_headers: bool = True,
                 stdout: bool = False):
        self.dry_run = dry_run
        self.merge_lines_opt = merge_lines
        self.dehyphenate_opt = dehyphenate
        self.normalize_ws_opt = normalize_ws
        self.normalize_unicode_opt = normalize_unicode
        self.remove_headers_opt = remove_headers
        self.stdout_opt = stdout
        self.log_file = Path('.strip-log')
        self.stats = {
            'files_processed': 0,
            'lines_removed': 0,
            'duplicates_collapsed': 0,
            'empty_lines_removed': 0,
            'header_footer_removed': 0,
            'punctuation_lines_removed': 0,
            'dehyphenated_tokens': 0,
            'repeating_headers_footers_removed': 0,
            'merged_lines': 0,
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
        
        # Single bullet artifacts: •, *, ·, etc.
        if re.match(r'^\s*[\u2022•·*]\s*$', stripped):
            return True
        
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
    
    def dehyphenate_text(self, text: str) -> Tuple[str, int]:
        """Remove hyphenation across line breaks. Only applies to lowercase continuation."""
        if not text:
            return text, 0
        
        # Count matches before replacement
        matches = re.findall(r'-\n([a-z]{1,})', text)
        tokens_fixed = len(matches)
        
        # Replace "-\n[a-z]" with just the lowercase part (safe dehyphenation)
        dehyphenated = re.sub(r'-\n([a-z]{1,})', r'\1', text)
        
        return dehyphenated, tokens_fixed
    
    def detect_pages(self, text: str) -> List[int]:
        """Detect page boundaries. Returns list of line indices where pages start."""
        lines = text.split('\n')
        
        # First try: split by form-feed
        if '\f' in text:
            boundaries = []
            
            # Check for form-feeds within lines
            for i, line in enumerate(lines):
                if '\f' in line:
                    # This line contains a form-feed, so it's a boundary
                    boundaries.append(i)
            
            # Also check for standalone form-feeds between pages
            if not boundaries:
                pages = text.split('\f')
                if len(pages) > 1:
                    line_index = 0
                    for i in range(1, len(pages)):
                        prev_page_lines = pages[i - 1].split('\n')
                        line_index += len(prev_page_lines)
                        boundaries.append(line_index)
            
            return boundaries
        
        # Second try: detect "Page X of Y" patterns as page boundaries
        page_markers = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            # Match "Page X of Y" or "Page X" patterns
            if re.match(r'^Page\s+\d+(\s+of\s+\d+)?$', stripped, re.IGNORECASE):
                page_markers.append(i)
        
        if len(page_markers) > 1:
            # Return line indices after each page marker (except the last one)
            return page_markers[1:]  # Skip first marker as it's the start
        
        # Fallback: split by 3+ consecutive newlines (pseudo-page boundaries)
        boundaries = []
        consecutive_empty = 0
        
        for i, line in enumerate(lines):
            if not line.strip():
                consecutive_empty += 1
            else:
                if consecutive_empty >= 3:
                    boundaries.append(i)
                consecutive_empty = 0
        
        return boundaries
    
    def detect_repeating_headers_footers(self, text: str, pages: List[int]) -> set:
        """Detect headers/footers that repeat across pages."""
        lines = text.split('\n')
        first_lines = []
        last_lines = []
        
        # Extract first/last non-empty line from each page (skipping known header/footer patterns)
        start_idx = 0
        total_pages = len(pages) + 1  # pages.length boundaries = pages.length + 1 pages
        
        # Need at least 2 pages to detect repeating headers/footers
        if total_pages < 2:
            return set()
        
        for i in range(len(pages) + 1):
            end_idx = pages[i] if i < len(pages) else len(lines)
            
            # Find first non-empty line in this page (skip known header/footer patterns)
            for j in range(start_idx, end_idx):
                stripped = lines[j].strip()
                if stripped and not self.is_header_footer(stripped) and not self.is_page_number(stripped):
                    first_lines.append(stripped)
                    break
            
            # Find last non-empty line in this page (skip known header/footer patterns)
            for j in range(end_idx - 1, start_idx - 1, -1):
                stripped = lines[j].strip()
                if stripped and not self.is_header_footer(stripped) and not self.is_page_number(stripped):
                    last_lines.append(stripped)
                    break
            
            start_idx = end_idx
        
        # Count frequency of each line
        from collections import Counter
        first_line_counts = Counter(first_lines)
        last_line_counts = Counter(last_lines)
        
        # Find lines that appear in >= 70% of pages
        threshold = max(1, int(total_pages * 0.7))
        to_remove = set()
        
        for line, count in first_line_counts.items():
            # Only remove if it appears frequently AND is not too short (likely content)
            # Minimum length check: exclude very short lines that might be content
            # Use length >= 8 to avoid removing common short words like "Content", "Summary", etc.
            if count >= threshold and len(line) >= 8:
                to_remove.add(line)
        
        for line, count in last_line_counts.items():
            # Only remove if it appears frequently AND is not too short (likely content)
            if count >= threshold and len(line) >= 8:
                to_remove.add(line)
        
        return to_remove
    
    def is_list_marker(self, line: str) -> bool:
        """Check if line starts with a list marker."""
        stripped = line.strip()
        # Bullet lists: - , • , * , · 
        if re.match(r'^\s*([-•*·])\s+', stripped):
            return True
        # Ordered lists: 1. , 1) , etc.
        if re.match(r'^\s*\d+[.)]\s+', stripped):
            return True
        return False
    
    def detect_table_block(self, lines: List[str], start_idx: int) -> Tuple[bool, int]:
        """Detect table-like blocks: ≥3 consecutive lines with ≥2 runs of ≥2 spaces at similar positions."""
        if start_idx >= len(lines) - 2:
            return False, start_idx
        
        check_lines = lines[start_idx:min(start_idx + 10, len(lines))]
        consecutive_table_lines = 0
        space_patterns = []
        
        for line in check_lines:
            if not line.strip():
                break  # Empty line breaks table pattern
            
            # Find positions of multiple spaces (≥2 spaces)
            matches = []
            for match in re.finditer(r' {2,}', line):
                matches.append(match.start())
            
            if len(matches) >= 2:
                space_patterns.append(matches)
                consecutive_table_lines += 1
            else:
                break
        
        if consecutive_table_lines >= 3:
            # Check if space positions are similar across lines
            similar_positions = 0
            if len(space_patterns) >= 3:
                first_pattern = space_patterns[0]
                for i in range(1, len(space_patterns)):
                    pattern = space_patterns[i]
                    # Check if at least 2 positions match (within ±2 chars)
                    matches = 0
                    for pos in first_pattern:
                        for pos2 in pattern:
                            if abs(pos - pos2) <= 2:
                                matches += 1
                                break
                    if matches >= 2:
                        similar_positions += 1
            
            if similar_positions >= 2:
                return True, start_idx + consecutive_table_lines
        
        return False, start_idx
    
    def merge_broken_lines(self, text: str, enabled: bool = False) -> Tuple[str, int]:
        """Merge broken lines mid-sentence, protecting lists."""
        if not enabled or not text:
            return text, 0
        
        lines = text.split('\n')
        merged_lines = []
        lines_merged = 0
        table_block_end = -1
        
        for i in range(len(lines)):
            # Check if we're in a table block
            if i >= table_block_end:
                is_table, end_idx = self.detect_table_block(lines, i)
                if is_table:
                    table_block_end = end_idx
            
            # Skip merge if in table block
            if i < table_block_end:
                merged_lines.append(lines[i])
                continue
            
            # Check if we should merge with previous line
            if merged_lines:
                prev_line = merged_lines[-1]
                current_line = lines[i]
                
                # Don't merge if previous or current line is empty
                if not prev_line.strip() or not current_line.strip():
                    merged_lines.append(current_line)
                    continue
                
                # Merge conditions:
                # 1. Previous line doesn't end with [.!?]
                # 2. Current line doesn't start with list marker
                # 3. Next line (if exists) doesn't start with list marker
                
                prev_ends_with_punct = bool(re.search(r'[.!?]\s*$', prev_line))
                next_is_list = (i < len(lines) - 1 and 
                               lines[i + 1].strip() and 
                               self.is_list_marker(lines[i + 1]))
                current_is_list = current_line.strip() and self.is_list_marker(current_line)
                
                if not prev_ends_with_punct and not current_is_list and not next_is_list:
                    # Merge: remove newline, add space
                    merged_lines[-1] = prev_line.rstrip() + ' ' + current_line.lstrip()
                    lines_merged += 1
                    continue
            
            merged_lines.append(lines[i])
        
        return '\n'.join(merged_lines), lines_merged
    
    def normalize_whitespace(self, text: str, enabled: bool = False, skip_table_blocks: bool = True) -> Tuple[str, bool]:
        """Normalize whitespace, protecting table blocks if enabled."""
        if not enabled or not text:
            return text, False
        
        lines = text.split('\n')
        normalized_lines = []
        table_block_end = -1
        
        for i in range(len(lines)):
            line = lines[i]
            
            # Check if we're in a table block
            if skip_table_blocks and i >= table_block_end:
                is_table, end_idx = self.detect_table_block(lines, i)
                if is_table:
                    table_block_end = end_idx
            
            # Skip normalization if in table block
            if skip_table_blocks and i < table_block_end:
                normalized_lines.append(line)
                continue
            
            # Normalize whitespace
            # Collapse multiple spaces to single space
            line = re.sub(r'\s+', ' ', line)
            # Normalize tabs to spaces
            line = line.replace('\t', ' ')
            # Trim trailing spaces
            line = re.sub(r'\s+$', '', line)
            
            normalized_lines.append(line)
        
        return '\n'.join(normalized_lines), True
    
    def normalize_unicode_punctuation(self, text: str, enabled: bool = False) -> Tuple[str, bool]:
        """Normalize Unicode punctuation to ASCII (limited, only punctuation)."""
        if not enabled or not text:
            return text, False
        
        # Limited Unicode normalization: only common punctuation
        unicode_map = {
            '\u201C': '"',  # Left double quotation mark
            '\u201D': '"',   # Right double quotation mark
            '\u2018': "'",   # Left single quotation mark
            '\u2019': "'",   # Right single quotation mark
            '\u2013': '-',   # En dash
            '\u2014': '-',   # Em dash
            '\u2026': '...', # Horizontal ellipsis
        }
        
        normalized = text
        replacements = 0
        
        for unicode_char, ascii_char in unicode_map.items():
            count = normalized.count(unicode_char)
            if count > 0:
                replacements += count
                normalized = normalized.replace(unicode_char, ascii_char)
        
        return normalized, replacements > 0

    def clean_text(self, text: str,
                   merge_lines: bool = False,
                   normalize_ws: bool = False,
                   normalize_unicode: bool = False,
                   dehyphenate: bool = False,
                   remove_headers: bool = True) -> Tuple[str, dict]:
        """Clean text by removing noise."""
        if not text:
            return "", {}
        
        # Apply dehyphenation first (before line-by-line processing)
        dehyphenated_tokens = 0
        if dehyphenate:
            text, dehyphenated_tokens = self.dehyphenate_text(text)
        
        # Apply merge broken lines (before whitespace normalization)
        text, merged_lines_count = self.merge_broken_lines(text, enabled=merge_lines)
        
        # Apply whitespace normalization (with table protection)
        text, normalized_ws = self.normalize_whitespace(text, enabled=normalize_ws, skip_table_blocks=True)
        
        # Apply Unicode punctuation normalization (limited, only punctuation)
        text, normalized_unicode = self.normalize_unicode_punctuation(text, enabled=normalize_unicode)
        
        lines = text.split('\n')
        cleaned_lines = []
        prev_line = None
        local_stats = {
            'lines_removed': 0,
            'duplicates_collapsed': 0,
            'empty_lines_removed': 0,
            'header_footer_removed': 0,
            'punctuation_lines_removed': 0,
            'dehyphenated_tokens': dehyphenated_tokens,
            'repeating_headers_footers_removed': 0,
            'merged_lines': merged_lines_count,
        }
        
        # Detect repeating headers/footers across pages
        repeating_headers_footers = set()
        if remove_headers:
            page_boundaries = self.detect_pages(text)
            repeating_headers_footers = self.detect_repeating_headers_footers(text, page_boundaries)
        
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
            if remove_headers and self.is_page_number(stripped):
                local_stats['header_footer_removed'] += 1
                continue
            
            # Skip headers/footers
            if remove_headers and self.is_header_footer(stripped):
                local_stats['header_footer_removed'] += 1
                continue
            
            # Skip repeating headers/footers across pages
            if remove_headers and stripped in repeating_headers_footers:
                local_stats['repeating_headers_footers_removed'] += 1
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
    
    def process_file(self, file_path: Path, label: Optional[str] = None) -> bool:
        """Process a single file."""
        if not file_path.exists():
            print(f"Error: File not found: {file_path}", file=sys.stderr)
            return False
        
        print(f"Processing: {file_path}")
        
        # Read text (support '-' as stdin)
        if str(file_path) == '-':
            try:
                data = sys.stdin.buffer.read()
                try:
                    text = data.decode('utf-8')
                except UnicodeDecodeError:
                    text = data.decode('latin-1')
            except Exception as e:
                print(f"Error reading stdin: {e}", file=sys.stderr)
                return False
            if label is None:
                label = 'stdin'
        else:
            text = self.read_text_file(file_path)
        if text is None:
            return False
        
        # Clean text
        cleaned_text, stats = self.clean_text(
            text,
            merge_lines=self.merge_lines_opt,
            normalize_ws=self.normalize_ws_opt,
            normalize_unicode=self.normalize_unicode_opt,
            dehyphenate=self.dehyphenate_opt,
            remove_headers=self.remove_headers_opt,
        )
        
        # Update global stats
        self.stats['files_processed'] += 1
        self.stats['lines_removed'] += stats['lines_removed']
        self.stats['duplicates_collapsed'] += stats['duplicates_collapsed']
        self.stats['empty_lines_removed'] += stats['empty_lines_removed']
        self.stats['header_footer_removed'] += stats['header_footer_removed']
        self.stats['punctuation_lines_removed'] += stats.get('punctuation_lines_removed', 0)
        self.stats['dehyphenated_tokens'] += stats.get('dehyphenated_tokens', 0)
        self.stats['repeating_headers_footers_removed'] += stats.get('repeating_headers_footers_removed', 0)
        self.stats['merged_lines'] += stats.get('merged_lines', 0)
        
        # Show what would be changed
        if text != cleaned_text:
            print(f"  - Lines removed: {stats['lines_removed']}")
            print(f"  - Duplicates collapsed: {stats['duplicates_collapsed']}")
            print(f"  - Empty lines removed: {stats['empty_lines_removed']}")
            print(f"  - Headers/footers removed: {stats['header_footer_removed']}")
            if stats.get('punctuation_lines_removed', 0) > 0:
                print(f"  - Punctuation lines removed: {stats['punctuation_lines_removed']}")
            if stats.get('dehyphenated_tokens', 0) > 0:
                print(f"  - Dehyphenated tokens: {stats['dehyphenated_tokens']}")
            if stats.get('repeating_headers_footers_removed', 0) > 0:
                print(f"  - Repeating headers/footers removed: {stats['repeating_headers_footers_removed']}")
        
        # Save original for undo
        if self.stdout_opt:
            # Print to stdout; if multiple files, add a separator
            if label is None:
                label = str(file_path)
            # Print separator only if multiple inputs indicated by files_processed > 0
            if self.stats['files_processed'] > 0:
                print("\n---\n")
            print(cleaned_text, end='' if cleaned_text.endswith('\n') else '\n')
        elif not self.dry_run:
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
        if self.stats.get('dehyphenated_tokens', 0) > 0:
            print(f"Dehyphenated tokens: {self.stats['dehyphenated_tokens']}")
        if self.stats.get('repeating_headers_footers_removed', 0) > 0:
            print(f"Repeating headers/footers removed: {self.stats['repeating_headers_footers_removed']}")
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

    # Cleaning options (defaults ON; use flags to disable)
    parser.add_argument('--no-merge-lines', action='store_true', help='Disable merging of broken lines')
    parser.add_argument('--no-dehyphenate', action='store_true', help='Disable de-hyphenation across line breaks')
    parser.add_argument('--no-normalize-ws', action='store_true', help='Disable whitespace normalization')
    parser.add_argument('--no-normalize-unicode', action='store_true', help='Disable Unicode punctuation normalization')
    parser.add_argument('--keep-headers', action='store_true', help='Keep headers/footers/page numbers (do not remove)')
    parser.add_argument('--stdout', action='store_true', help='Write cleaned text to stdout instead of modifying files')
    
    args = parser.parse_args()
    
    # Handle undo
    if args.undo:
        success = undo_last_operation()
        sys.exit(0 if success else 1)
    
    # Check for files or stdin
    if not args.files:
        parser.print_help()
        sys.exit(1)
    
    # Process files
    stripper = DocStripper(
        dry_run=args.dry_run,
        merge_lines=not args.no_merge_lines,
        dehyphenate=not args.no_dehyphenate,
        normalize_ws=not args.no_normalize_ws,
        normalize_unicode=not args.no_normalize_unicode,
        remove_headers=not args.keep_headers,
        stdout=args.stdout,
    )
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
