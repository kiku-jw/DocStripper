#!/usr/bin/env python3
"""
Self-test script for DocStripper
Tests both unit tests and optionally real files from test_files/ (if directory exists)
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tool import DocStripper  # type: ignore


def assert_contains(text, needle):
    assert needle in text, f"Expected to find '{needle}' in output"


def assert_not_contains(text, needle):
    assert needle not in text, f"Expected NOT to find '{needle}' in output"


def run_unit_tests():
    """Run basic unit tests"""
    print("Running unit tests...")
    ds = DocStripper(dry_run=True)

    # Dehyphenation
    sample = "auto-\nmatic"
    cleaned, stats = ds.clean_text(sample,
                                   merge_lines=True,
                                   normalize_ws=True,
                                   normalize_unicode=True,
                                   dehyphenate=True,
                                   remove_headers=True)
    assert cleaned.strip() == "automatic"
    assert stats.get('dehyphenated_tokens', 0) >= 1

    # Merge single newline without punctuation
    sample = "Hello world\nthis is fine."
    cleaned, stats = ds.clean_text(sample,
                                   merge_lines=True,
                                   normalize_ws=True,
                                   normalize_unicode=False,
                                   dehyphenate=False,
                                   remove_headers=True)
    assert cleaned.startswith("Hello world this")
    assert stats.get('merged_lines', 0) >= 1

    # Remove page numbers and headers
    sample = "Page 1\nCONFIDENTIAL\nContent line\n1\n"
    cleaned, stats = ds.clean_text(sample,
                                   merge_lines=False,
                                   normalize_ws=False,
                                   normalize_unicode=False,
                                   dehyphenate=False,
                                   remove_headers=True)
    assert "Content line" in cleaned
    assert "Page 1" not in cleaned
    assert "CONFIDENTIAL" not in cleaned
    assert "\n1\n" not in cleaned

    # Keep headers when requested
    sample = "Page 2\nContent"
    cleaned, _ = ds.clean_text(sample,
                               merge_lines=False,
                               normalize_ws=False,
                               normalize_unicode=False,
                               dehyphenate=False,
                               remove_headers=False)
    assert "Page 2" in cleaned

    print("✓ Unit tests passed")


def run_file_tests():
    """Test on real files (optional - skip if test_files directory not present)"""
    print("\nRunning file tests...")
    
    repo_root = Path(__file__).resolve().parents[1]
    test_files_dir = repo_root / "test_files"
    
    if not test_files_dir.exists():
        print(f"⚠ test_files directory not found at {test_files_dir} (skipping file tests)")
        return 0
    
    test_files = sorted(test_files_dir.glob("*.txt"))
    
    if not test_files:
        print(f"⚠ No .txt files found in {test_files_dir} (skipping file tests)")
        return 0
    
    print(f"Found {len(test_files)} test file(s)")
    
    ds = DocStripper(dry_run=True, 
                     merge_lines=True,
                     dehyphenate=True,
                     normalize_ws=True,
                     normalize_unicode=True,
                     remove_headers=True)
    
    passed = 0
    failed = 0
    
    for test_file in test_files[:10]:  # Limit to 10 files
        try:
            with open(test_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            if not content.strip():
                print(f"  ⚠ {test_file.name}: empty file, skipping")
                continue
            
            # Test cleaning
            cleaned, stats = ds.clean_text(content,
                                          merge_lines=True,
                                          normalize_ws=True,
                                          normalize_unicode=True,
                                          dehyphenate=True,
                                          remove_headers=True)
            
            # Basic sanity checks
            assert len(cleaned) <= len(content) + 1000, f"Cleaned text too long for {test_file.name}"
            assert isinstance(stats, dict), f"Stats should be dict for {test_file.name}"
            
            # Check that stats have expected keys
            expected_keys = ['lines_removed', 'duplicates_collapsed', 'empty_lines_removed', 
                           'header_footer_removed', 'dehyphenated_tokens', 'merged_lines']
            for key in expected_keys:
                assert key in stats, f"Missing stat '{key}' for {test_file.name}"
            
            print(f"  ✓ {test_file.name}: {len(content)} → {len(cleaned)} chars, "
                  f"removed {stats.get('lines_removed', 0)} lines")
            passed += 1
            
        except Exception as e:
            print(f"  ✗ {test_file.name}: {e}")
            failed += 1
    
    print(f"\nFile tests: {passed} passed, {failed} failed")
    return failed


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("DocStripper Self-Test Suite")
    print("=" * 60)
    
    try:
        run_unit_tests()
        file_failures = run_file_tests()
        
        print("\n" + "=" * 60)
        if file_failures == 0:
            print("✅ All tests passed!")
            return 0
        else:
            print(f"❌ {file_failures} test(s) failed")
            return 1
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())


