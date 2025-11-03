#!/usr/bin/env python3
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test_inputs'


def write_txt_samples():
    OUT.mkdir(exist_ok=True)
    (OUT / 'sample1_basic.txt').write_text(
        'Page 1 of 2\nConfidential\n\nIntroduction\nThis is auto-\nmatic text.\n\n1\n\nPage 2 of 2\nDRAFT\nMain content here.\n',
        encoding='utf-8'
    )
    (OUT / 'sample2_lists_tables.txt').write_text(
        '- Item one\n- Item two\n\nName    Age    City\nAlice   30     Paris\nBob     22     Berlin\n',
        encoding='utf-8'
    )
    (OUT / 'sample3_multilingual.txt').write_text(
        'Страница 1 из 1\nЗаголовок\n\nПривет, мир!\nこんにちは 世界\n',
        encoding='utf-8'
    )


def make_minimal_docx(path: Path, text: str):
    path.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(path, 'w') as z:
        z.writestr('[Content_Types].xml', (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '</Types>'
        ))
        z.writestr('_rels/.rels', (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/word/document.xml"/>'
            '</Relationships>'
        ))
        z.writestr('word/_rels/document.xml.rels', (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships" />'
        ))
        # Very simple document.xml containing paragraphs
        def para(t):
            return f'<w:p><w:r><w:t>{t}</w:t></w:r></w:p>'
        body = ''.join(para(p) for p in text.split('\n'))
        document_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f'<w:body>{body}</w:body>'
            '</w:document>'
        )
        z.writestr('word/document.xml', document_xml)


def write_docx_sample():
    sample_text = 'Page 1\nConfidential\n\nTitle\nThis is auto-\nmatic text in DOCX.'
    make_minimal_docx(OUT / 'sample4_simple.docx', sample_text)


def main():
    write_txt_samples()
    write_docx_sample()
    print(f"Samples written to {OUT}")


if __name__ == '__main__':
    main()


