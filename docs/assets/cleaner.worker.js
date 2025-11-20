// DocStripper Web Worker - Offloads cleaning to prevent UI freezing

// Simplified DocStripper class for worker context
class WorkerDocStripper {
    constructor(options = {}) {
        this.options = {
            removeEmptyLines: options.removeEmptyLines !== false,
            removePageNumbers: options.removePageNumbers !== false,
            removeHeadersFooters: options.removeHeadersFooters !== false,
            removeDuplicates: options.removeDuplicates !== false,
            removePunctuationLines: options.removePunctuationLines !== false,
            preserveParagraphSpacing: options.preserveParagraphSpacing !== false,
            dehyphenate: options.dehyphenate !== false,
            mergeBrokenLines: options.mergeBrokenLines !== undefined ? options.mergeBrokenLines : false,
            normalizeWhitespace: options.normalizeWhitespace !== undefined ? options.normalizeWhitespace : false,
            keepTableSpacing: options.keepTableSpacing !== false,
            normalizeUnicode: options.normalizeUnicode !== undefined ? options.normalizeUnicode : false,
        };
        
        this.headerPatterns = [
            /^Page\s+\d+\s+of\s+\d+$/i,
            /^\d+\s+of\s+\d+$/i,
            /^Page\s+\d+$/i,
            /^Página\s+\d+\s+de\s+\d+$/i,
            /^Страница\s+\d+\s+из\s+\d+$/i,
            /^Confidential$/i,
            /^CONFIDENTIAL$/i,
            /^DRAFT$/i,
            /^Draft$/i,
            /^INTERNAL$/i,
            /^Internal$/i,
            /^PRIVATE$/i,
            /^Private$/i,
            /^RESTRICTED$/i,
            /^Restricted$/i,
            /^CLASSIFIED$/i,
            /^Classified$/i,
            /^FOR INTERNAL USE ONLY$/i,
            /^FOR\s+INTERNAL\s+USE\s+ONLY$/i,
            /^INTERNAL USE ONLY$/i,
            /^DO NOT DISTRIBUTE$/i,
            /^PROPRIETARY$/i,
            /^Proprietary$/i,
            /^CONFIDENTIAL\s*-\s*INTERNAL\s+USE\s+ONLY$/i,
            /^Confidential\s*-\s*Internal\s+Use\s+Only$/i,
            /^DRAFT\s*-\s*NOT\s+FOR\s+DISTRIBUTION$/i,
            /^Draft\s*-\s*Not\s+for\s+Distribution$/i,
            /^STRICTLY\s+CONFIDENTIAL$/i,
            /^TOP\s+SECRET$/i,
            /^PROPRIETARY\s+AND\s+CONFIDENTIAL$/i,
        ];
    }

    isPageNumber(line) {
        const stripped = line.trim();
        if (!stripped) return false;
        if (/^\d+$/.test(stripped)) return true;
        if (/^[IVXLCDM]+$/i.test(stripped) && stripped.length <= 10) return true;
        if (/^[A-Z]$/i.test(stripped)) return true;
        return false;
    }

    isPunctuationOnly(line) {
        const stripped = line.trim();
        if (!stripped) return false;
        if (/^\s*[\u2022•·*]\s*$/.test(stripped)) return true;
        return /^[^\w\s]+$/.test(stripped) && stripped.length <= 50;
    }

    isHeaderFooter(line) {
        const stripped = line.trim();
        return this.headerPatterns.some(pattern => pattern.test(stripped));
    }
    
    dehyphenateText(text) {
        if (!text || !this.options.dehyphenate) {
            return { text: text || '', tokensFixed: 0 };
        }
        const matches = text.match(/-\n([a-z]{1,})/g);
        const tokensFixed = matches ? matches.length : 0;
        const dehyphenated = text.replace(/-\n([a-z]{1,})/g, '$1');
        return { text: dehyphenated, tokensFixed };
    }

    isListMarker(line) {
        const trimmed = line.trim();
        if (!trimmed) return false;
        return /^[\u2022•·*-]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed);
    }

    detectTableBlock(lines, startIdx) {
        if (startIdx >= lines.length) return null;
        const block = [lines[startIdx]];
        let spaces = (lines[startIdx].match(/^(\s*)/)?.[1] || '').length;
        let consecutiveSpaces = 0;
        
        for (let i = startIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) break;
            const lineSpaces = (line.match(/^(\s*)/)?.[1] || '').length;
            if (lineSpaces === spaces && /  +/.test(line)) {
                block.push(line);
                consecutiveSpaces++;
            } else if (consecutiveSpaces >= 2) {
                break;
            } else {
                break;
            }
        }
        return consecutiveSpaces >= 2 ? { start: startIdx, end: startIdx + block.length - 1 } : null;
    }

    mergeBrokenLines(lines) {
        if (!this.options.mergeBrokenLines) return { lines, merged: 0 };
        
        const mergedLines = [];
        let linesMerged = 0;
        const tableBlocks = new Set();
        
        for (let i = 0; i < lines.length; i++) {
            const tableBlock = this.detectTableBlock(lines, i);
            if (tableBlock) {
                for (let j = tableBlock.start; j <= tableBlock.end; j++) {
                    tableBlocks.add(j);
                }
            }
        }
        
        for (let i = 0; i < lines.length; i++) {
            if (tableBlocks.has(i)) {
                mergedLines.push(lines[i]);
                continue;
            }
            
            const currentLine = lines[i];
            if (mergedLines.length === 0) {
                mergedLines.push(currentLine);
                continue;
            }
            
            const prevLine = mergedLines[mergedLines.length - 1];
            if (!prevLine.trim() || !currentLine.trim()) {
                mergedLines.push(currentLine);
                continue;
            }
            
            const prevEndsWithPunct = /[.!?]\s*$/.test(prevLine);
            const nextIsList = i < lines.length - 1 && lines[i + 1].trim() && this.isListMarker(lines[i + 1]);
            const currentIsList = this.isListMarker(currentLine);
            const prevIsHeader = this.isHeaderFooter(prevLine.trim()) || this.isPageNumber(prevLine.trim());
            const currentIsHeader = this.isHeaderFooter(currentLine.trim()) || this.isPageNumber(currentLine.trim());
            
            if (!prevEndsWithPunct && !currentIsList && !nextIsList && !prevIsHeader && !currentIsHeader) {
                mergedLines[mergedLines.length - 1] = prevLine.trimEnd() + ' ' + currentLine.trimStart();
                linesMerged++;
                continue;
            }
            
            mergedLines.push(currentLine);
        }
        
        return { lines: mergedLines, merged: linesMerged };
    }

    normalizeWhitespace(text, skipTableBlocks) {
        if (!this.options.normalizeWhitespace || !text) return text;
        if (skipTableBlocks && skipTableBlocks.length > 0) {
            // Preserve table blocks
            return text;
        }
        return text.replace(/[ \t]+/g, ' ').replace(/^ +| +$/gm, '');
    }

    normalizeUnicodePunctuation(text) {
        if (!this.options.normalizeUnicode || !text) return text;
        const replacements = {
            '\u2018': "'", '\u2019': "'",
            '\u201C': '"', '\u201D': '"',
            '\u2013': '-', '\u2014': '--',
            '\u2026': '...',
        };
        return text.replace(/[\u2018\u2019\u201C\u201D\u2013\u2014\u2026]/g, m => replacements[m] || m);
    }

    cleanText(text) {
        if (!text) return { text: '', stats: this.getEmptyStats() };
        
        const dehyphenResult = this.dehyphenateText(text);
        text = dehyphenResult.text;
        
        let lines = text.split('\n');
        const preMergeLines = [];
        let headerFooterRemovedBeforeMerge = 0;
        
        const pageBoundaries = [];
        let prevWasEmpty = true;
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) {
                if (prevWasEmpty) continue;
                prevWasEmpty = true;
                if (i > 0 && i < lines.length - 1) {
                    pageBoundaries.push(i);
                }
            } else {
                prevWasEmpty = false;
            }
        }
        
        const repeatingHeadersFooters = new Set();
        const firstLine = lines.find(l => l.trim());
        const lastLine = lines.slice().reverse().find(l => l.trim());
        if (firstLine && firstLine.trim().length >= 8) {
            const count = lines.filter(l => l.trim() === firstLine.trim()).length;
            if (count >= Math.max(2, pageBoundaries.length * 0.7)) {
                repeatingHeadersFooters.add(firstLine.trim());
            }
        }
        if (lastLine && lastLine.trim().length >= 8 && lastLine.trim() !== firstLine?.trim()) {
            const count = lines.filter(l => l.trim() === lastLine.trim()).length;
            if (count >= Math.max(2, pageBoundaries.length * 0.7)) {
                repeatingHeadersFooters.add(lastLine.trim());
            }
        }
        
        let prevLineRemoved = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (!trimmed) {
                if (this.options.removeEmptyLines && (!this.options.preserveParagraphSpacing || prevLineRemoved)) {
                    prevLineRemoved = true;
                    continue;
                }
                preMergeLines.push(line);
                prevLineRemoved = false;
                continue;
            }
            
            const isRepeating = repeatingHeadersFooters.has(trimmed);
            const isPageNum = this.isPageNumber(trimmed);
            const isHeader = this.isHeaderFooter(trimmed);
            const isPunctOnly = this.isPunctuationOnly(trimmed);
            
            if ((this.options.removePageNumbers && isPageNum) ||
                (this.options.removeHeadersFooters && (isHeader || isRepeating)) ||
                (this.options.removePunctuationLines && isPunctOnly)) {
                if (isHeader || isRepeating) headerFooterRemovedBeforeMerge++;
                prevLineRemoved = true;
                continue;
            }
            
            preMergeLines.push(line);
            prevLineRemoved = false;
        }
        
        const mergeResult = this.mergeBrokenLines(preMergeLines);
        lines = mergeResult.lines;
        
        let normalized = lines.join('\n');
        normalized = this.normalizeWhitespace(normalized);
        normalized = this.normalizeUnicodePunctuation(normalized);
        lines = normalized.split('\n');
        
        let duplicatesCollapsed = 0;
        const finalLines = [];
        let lastLine = null;
        
        for (const line of lines) {
            if (this.options.removeDuplicates && lastLine !== null && line.trim() === lastLine.trim() && line.trim()) {
                duplicatesCollapsed++;
                continue;
            }
            finalLines.push(line);
            lastLine = line;
        }
        
        const finalText = finalLines.join('\n');
        const emptyLinesRemoved = (text.split('\n').length - finalText.split('\n').length) - duplicatesCollapsed;
        
        return {
            text: finalText,
            stats: {
                linesRemoved: preMergeLines.length - finalLines.length + duplicatesCollapsed,
                duplicatesCollapsed,
                emptyLinesRemoved: Math.max(0, emptyLinesRemoved),
                headerFooterRemoved: headerFooterRemovedBeforeMerge,
                punctuationLinesRemoved: 0,
                dehyphenatedTokens: dehyphenResult.tokensFixed,
                repeatingHeadersFootersRemoved: repeatingHeadersFooters.size,
                mergedLines: mergeResult.merged,
            }
        };
    }

    getEmptyStats() {
        return {
            linesRemoved: 0,
            duplicatesCollapsed: 0,
            emptyLinesRemoved: 0,
            headerFooterRemoved: 0,
            punctuationLinesRemoved: 0,
            dehyphenatedTokens: 0,
            repeatingHeadersFootersRemoved: 0,
            mergedLines: 0,
        };
    }
}

// Worker message handler
self.addEventListener('message', (e) => {
    const { text, options } = e.data;
    try {
        const stripper = new WorkerDocStripper(options);
        const result = stripper.cleanText(text);
        self.postMessage({ success: true, result });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
});
