#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tool import DocStripper  # type: ignore


def assert_contains(text, needle):
    assert needle in text, f"Expected to find '{needle}' in output"


def run_tests():
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

    print("Self tests passed.")


if __name__ == "__main__":
    run_tests()


