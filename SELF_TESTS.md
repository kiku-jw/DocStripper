# SELF_TESTS.md

Test cases and usage examples for DocStripper

## Test 1: Duplicate Line Removal

**Input file:**
```
This is an important line.
This is an important line.
This is an important line.
Unique line.
Another line.
Another line.
```

**Expected output:**
```
This is an important line.
Unique line.
Another line.
```

**Expected statistics:**
- Duplicates collapsed: 2
- Lines removed: 2

---

## Test 2: Page Numbers and Headers Removal

**Input file:**
```
Page 1 of 10
Document starts here.
3
4
5
Page 2 of 10
Document continues.
```

**Expected output:**
```
Document starts here.
Document continues.
```

**Expected statistics:**
- Header/footer removed: 5
- Lines removed: 5

---

## Test 3: Empty Lines and Whitespace Removal

**Input file:**
```
First line.


Second line.
   
Third line.
```

**Expected output:**
```
First line.
Second line.
Third line.
```

**Expected statistics:**
- Empty lines removed: 4

---

## Test 4: Comprehensive Test

**Input file:**
```
Confidential
Page 1 of 5

Main document text.
Main document text.

1
2
3

DRAFT
Important information.
Page 2 of 5
```

**Expected output:**
```
Main document text.
Important information.
```

**Expected statistics:**
- Lines removed: 10
- Duplicates collapsed: 1
- Empty lines removed: 2
- Header/footer removed: 7

---

## Test 5: DOCX File Processing

**Prerequisites:**
- Create a test DOCX file with content from Test 1

**Command:**
```bash
python tool.py test.docx
```

**Expected behavior:**
- File should be processed
- Backup file `test.docx.bak` created
- Text should be cleaned similar to Test 1

---

## How to Run Tests

1. Create test files with content from examples above
2. Run DocStripper in dry-run mode:
```bash
python tool.py --dry-run test1.txt
```
3. Check the output statistics
4. Run actual processing:
```bash
python tool.py test1.txt
```
5. Verify results and compare with expected output
6. If needed, perform undo:
```bash
python tool.py --undo
```

## Notes

- All tests should run on Python 3.9+
- PDF tests require `pdftotext` to be installed
- Backup files (`.bak`) can be used for comparison
