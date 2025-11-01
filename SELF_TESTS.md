# Self-Tests for DocStripper

This document describes manual test steps and expected results for verifying DocStripper functionality.

## Test Environment

- **Web Version**: https://kiku-jw.github.io/DocStripper/
- **CLI Version**: `python tool.py [options] <files>`

## Test Fixtures

### Fixture 1: Headers/Footers + Page Numbers
**File**: `examples/fixture1_headers_footers.txt`

**Content**:
```
Page 1 of 5
Confidential - Internal Use Only
Executive Summary
This is important content.

Page 2 of 5
Confidential - Internal Use Only
Main Content
More important information here.

Page 3 of 5
Confidential - Internal Use Only
Conclusion
Final thoughts.
1
2
3
```

**Expected Results (Conservative Mode)**:
- Lines removed: ~10-12
- Headers/footers removed: ~6 (Page X of Y, Confidential headers)
- Repeating headers/footers removed: ~3 (Confidential - Internal Use Only appears on 3/3 pages = 100% > 70%)
- Page numbers removed: 3 (1, 2, 3)
- Empty lines removed: ~3-4

**Expected Output**:
```
Executive Summary
This is important content.
Main Content
More important information here.
Conclusion
Final thoughts.
```

### Fixture 2: Hyphenation + Mid-Sentence Wraps
**File**: `examples/fixture2_hyphenation.txt`

**Content**:
```
This is auto-
matic text processing.
The system can handle
broken lines mid-sentence.
This is normal text.
```

**Expected Results (Conservative Mode)**:
- Dehyphenated tokens: 1 ("auto-\nmatic" → "automatic")
- Lines merged: 0 (Conservative mode doesn't merge lines)
- Empty lines removed: 1

**Expected Output (Conservative)**:
```
This is automatic text processing.
The system can handle
broken lines mid-sentence.
This is normal text.
```

**Expected Results (Aggressive Mode)**:
- Dehyphenated tokens: 1
- Lines merged: 2 ("can handle\nbroken" and "lines mid-sentence.\nThis")
- Empty lines removed: 1

**Expected Output (Aggressive)**:
```
This is automatic text processing.
The system can handle broken lines mid-sentence. This is normal text.
```

### Fixture 3: Lists & Pseudo-Tables
**File**: `examples/fixture3_lists_tables.txt`

**Content**:
```
• First bullet point
• Second bullet point
• Third bullet point

1. First numbered item
2. Second numbered item
3. Third numbered item

Column1    Column2    Column3
Data1      Data2      Data3
Value1     Value2     Value3

Normal paragraph here
with multiple    spaces.
```

**Expected Results (Conservative Mode)**:
- Lists preserved: All bullet and numbered items remain separate lines
- Table spacing preserved: Multiple spaces in table remain intact
- Empty lines removed: 2
- Punctuation lines removed: 0

**Expected Output (Conservative)**:
```
• First bullet point
• Second bullet point
• Third bullet point
1. First numbered item
2. Second numbered item
3. Third numbered item
Column1    Column2    Column3
Data1      Data2      Data3
Value1     Value2     Value3
Normal paragraph here
with multiple    spaces.
```

**Expected Results (Aggressive Mode)**:
- Lists preserved: All bullet and numbered items remain separate lines (list guards)
- Table spacing preserved: Multiple spaces in table remain intact (table guards)
- Lines merged: 0 (no mid-sentence breaks that meet merge criteria)
- Whitespace normalized: Only in non-table areas (paragraph with multiple spaces)
- Empty lines removed: 2

**Expected Output (Aggressive)**:
```
• First bullet point
• Second bullet point
• Third bullet point
1. First numbered item
2. Second numbered item
3. Third numbered item
Column1    Column2    Column3
Data1      Data2      Data3
Value1     Value2     Value3
Normal paragraph here with multiple spaces.
```

## Manual Test Steps

### Web Version Tests

1. **Conservative Mode Test**:
   - Open https://kiku-jw.github.io/DocStripper/
   - Select "Conservative" mode (should be default)
   - Upload `fixture1_headers_footers.txt`
   - Click "Start Cleaning"
   - Verify side-by-side preview shows Original | Cleaned
   - Verify stats match expected results
   - Download cleaned file and verify content

2. **Aggressive Mode Test**:
   - Switch to "Aggressive" mode
   - Upload `fixture2_hyphenation.txt`
   - Verify merge broken lines checkbox is ON
   - Verify normalize whitespace checkbox is ON
   - Click "Start Cleaning"
   - Verify lines are merged correctly
   - Verify lists are NOT merged (protection working)

3. **Table Protection Test**:
   - Use Aggressive mode
   - Upload `fixture3_lists_tables.txt`
   - Verify table spacing is preserved
   - Verify lists are preserved

4. **Settings Persistence Test**:
   - Change some checkbox settings
   - Reload page
   - Verify settings are restored

5. **Large File Test**:
   - Upload a file > 1MB
   - Verify virtualization works (no lag)
   - Verify side-by-side preview renders correctly

### CLI Version Tests

1. **Basic Cleaning (Conservative)**:
   ```bash
   python tool.py examples/fixture1_headers_footers.txt
   ```
   - Verify headers/footers removed
   - Verify page numbers removed
   - Verify repeating headers removed

2. **Dehyphenation Test**:
   ```bash
   python tool.py examples/fixture2_hyphenation.txt
   ```
   - Verify "auto-\nmatic" → "automatic"
   - Check stats show dehyphenated tokens: 1

3. **Dry-Run Test**:
   ```bash
   python tool.py --dry-run examples/fixture1_headers_footers.txt
   ```
   - Verify file is not modified
   - Verify stats are shown

4. **Multiple Files Test**:
   ```bash
   python tool.py examples/fixture*.txt
   ```
   - Verify all files processed
   - Verify aggregate stats shown

## Acceptance Criteria

### Conservative Mode
- ✅ Never breaks lists (bullet or numbered)
- ✅ Never breaks tables (spacing preserved)
- ✅ Dehyphenation works (only lowercase after hyphen)
- ✅ Repeating headers/footers removed (≥70% threshold)
- ✅ Page numbers removed
- ✅ Empty lines removed (with paragraph spacing option)

### Aggressive Mode
- ✅ All Conservative mode features work
- ✅ Line merging works with list/table protection
- ✅ Whitespace normalization works with table protection
- ✅ Lists remain intact
- ✅ Tables remain intact

### Performance
- ✅ Files < 1MB: Instant processing (< 100ms)
- ✅ Files 1-5MB: Processing < 2s
- ✅ Files > 5MB: Virtualization prevents UI freeze
- ✅ Side-by-side preview renders smoothly

### UI/UX
- ✅ Settings persist across page reloads
- ✅ Side-by-side preview shows Original | Cleaned
- ✅ Stats line shows accurate counts
- ✅ Copy and Download buttons work
- ✅ Mode switching updates defaults correctly

## Regression Tests

Run these tests after any changes to ensure no regressions:

1. **List Protection**: Verify lists are never merged or broken
2. **Table Protection**: Verify table spacing is preserved
3. **Header Detection**: Verify content headers are never removed
4. **Dehyphenation Safety**: Verify only lowercase continuations are merged
5. **Performance**: Verify large files don't cause UI freeze

## Known Limitations

- Unicode normalization only affects punctuation (not alphabets)
- Table detection uses heuristics (may miss some table formats)
- Page boundary detection uses form-feed or 3+ consecutive newlines
- Repeating header/footer detection requires ≥70% frequency and ≥8 characters

## Test Status

- [ ] Fixture 1 tested (Conservative)
- [ ] Fixture 1 tested (Aggressive)
- [ ] Fixture 2 tested (Conservative)
- [ ] Fixture 2 tested (Aggressive)
- [ ] Fixture 3 tested (Conservative)
- [ ] Fixture 3 tested (Aggressive)
- [ ] Settings persistence tested
- [ ] Large file virtualization tested
- [ ] CLI version tested

