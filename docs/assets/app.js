// DocStripper Web App - JavaScript Implementation

class DocStripper {
    constructor(options = {}) {
        // Default options - all enabled
        this.options = {
            removeEmptyLines: options.removeEmptyLines !== false,
            removePageNumbers: options.removePageNumbers !== false,
            removeHeadersFooters: options.removeHeadersFooters !== false,
            removeDuplicates: options.removeDuplicates !== false,
            removePunctuationLines: options.removePunctuationLines !== false,
            preserveParagraphSpacing: options.preserveParagraphSpacing !== false,
            dehyphenate: options.dehyphenate !== false, // Default ON in Conservative mode
            removeRepeatingHeadersFooters: options.removeRepeatingHeadersFooters !== false, // Default ON in Conservative mode
            mergeBrokenLines: options.mergeBrokenLines !== undefined ? options.mergeBrokenLines : false, // Default OFF in Conservative
            normalizeWhitespace: options.normalizeWhitespace !== undefined ? options.normalizeWhitespace : false, // Default OFF in Conservative
            keepTableSpacing: options.keepTableSpacing !== false, // Default ON
            normalizeUnicode: options.normalizeUnicode !== undefined ? options.normalizeUnicode : false, // Default OFF
        };
        
        // Enhanced header/footer patterns
        this.headerPatterns = [
            /^Page\s+\d+\s+of\s+\d+$/i,
            /^\d+\s+of\s+\d+$/i,
            /^Page\s+\d+$/i,
            /^Página\s+\d+\s+de\s+\d+$/i, // Spanish
            /^Страница\s+\d+\s+из\s+\d+$/i, // Russian "Page X of Y"
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
            // Compound headers with dashes
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
        
        // Regular numbers: 1, 2, 3, etc.
        if (/^\d+$/.test(stripped)) return true;
        
        // Roman numerals: I, II, III, IV, etc.
        if (/^[IVXLCDM]+$/i.test(stripped) && stripped.length <= 10) return true;
        
        // Single letters: A, B, C, etc. (common in appendices)
        if (/^[A-Z]$/i.test(stripped)) return true;
        
        return false;
    }

    isPunctuationOnly(line) {
        const stripped = line.trim();
        if (!stripped) return false;
        
        // Single bullet artifacts: •, *, ·, etc.
        if (/^\s*[\u2022•·*]\s*$/.test(stripped)) return true;
        
        // Lines with only punctuation characters: ---, ***, ===, etc.
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
        
        // Count matches before replacement
        const matches = text.match(/-\n([a-z]{1,})/g);
        const tokensFixed = matches ? matches.length : 0;
        
        // Replace "-\n[a-z]" with just the lowercase part (safe dehyphenation)
        const dehyphenated = text.replace(/-\n([a-z]{1,})/g, '$1');
        
        return { text: dehyphenated, tokensFixed };
    }
    
    detectPages(text) {
        const lines = text.split('\n');
        
        // First try: split by form-feed
        if (text.includes('\f')) {
            const boundaries = [];
            let lineIndex = 0;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('\f')) {
                    // Split this line by form-feed and count
                    const parts = lines[i].split('\f');
                    if (parts.length > 1) {
                        // Each part after the first creates a new page boundary
                        for (let j = 1; j < parts.length; j++) {
                            boundaries.push(i);
                        }
                    }
                }
            }
            
            // Also check for standalone form-feeds
            if (boundaries.length === 0) {
                const pages = text.split('\f');
                if (pages.length > 1) {
                    let lineIndex = 0;
                    for (let i = 1; i < pages.length; i++) {
                        const prevPageLines = pages[i - 1].split('\n');
                        lineIndex += prevPageLines.length;
                        boundaries.push(lineIndex);
                    }
                }
            }
            
            return boundaries;
        }
        
        // Second try: detect "Page X of Y" patterns as page boundaries
        const pageMarkers = [];
        for (let i = 0; i < lines.length; i++) {
            const stripped = lines[i].trim();
            // Match "Page X of Y" or "Page X" patterns
            if (/^Page\s+\d+(\s+of\s+\d+)?$/i.test(stripped)) {
                pageMarkers.push(i);
            }
        }
        
        if (pageMarkers.length > 1) {
            // Return line indices after each page marker (except the first one)
            return pageMarkers.slice(1); // Skip first marker as it's the start
        }
        
        // Fallback: split by 3+ consecutive newlines (pseudo-page boundaries)
        const boundaries = [];
        let consecutiveEmpty = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) {
                consecutiveEmpty++;
            } else {
                if (consecutiveEmpty >= 3) {
                    boundaries.push(i);
                }
                consecutiveEmpty = 0;
            }
        }
        
        return boundaries;
    }
    
    detectRepeatingHeadersFooters(text, pages) {
        if (!this.options.removeRepeatingHeadersFooters) {
            return new Set();
        }
        
        const lines = text.split('\n');
        const firstLines = [];
        const lastLines = [];
        
        // Extract first/last non-empty line from each page
        let startIdx = 0;
        const totalPages = pages.length + 1; // pages.length boundaries = pages.length + 1 pages
        
        // Need at least 2 pages to detect repeating headers/footers
        if (totalPages < 2) {
            return new Set();
        }
        
        for (let i = 0; i <= pages.length; i++) {
            const endIdx = i < pages.length ? pages[i] : lines.length;
            
            // Find first non-empty line in this page (skip known header/footer patterns)
            for (let j = startIdx; j < endIdx; j++) {
                const stripped = lines[j].trim();
                if (stripped && !this.isHeaderFooter(stripped) && !this.isPageNumber(stripped)) {
                    firstLines.push(stripped);
                    break;
                }
            }
            
            // Find last non-empty line in this page (skip known header/footer patterns)
            for (let j = endIdx - 1; j >= startIdx; j--) {
                const stripped = lines[j].trim();
                if (stripped && !this.isHeaderFooter(stripped) && !this.isPageNumber(stripped)) {
                    lastLines.push(stripped);
                    break;
                }
            }
            
            startIdx = endIdx;
        }
        
        // Count frequency of each line
        const firstLineCounts = new Map();
        const lastLineCounts = new Map();
        
        firstLines.forEach(line => {
            firstLineCounts.set(line, (firstLineCounts.get(line) || 0) + 1);
        });
        
        lastLines.forEach(line => {
            lastLineCounts.set(line, (lastLineCounts.get(line) || 0) + 1);
        });
        
        // Find lines that appear in >= 70% of pages
        const threshold = Math.max(1, Math.ceil(totalPages * 0.7));
        const toRemove = new Set();
        
        firstLineCounts.forEach((count, line) => {
            // Only remove if it appears frequently AND is not too short (likely content)
            // Minimum length check: exclude very short lines that might be content
            // Use length >= 8 to avoid removing common short words like "Content", "Summary", etc.
            if (count >= threshold && line.length >= 8) {
                toRemove.add(line);
            }
        });
        
        lastLineCounts.forEach((count, line) => {
            // Only remove if it appears frequently AND is not too short (likely content)
            if (count >= threshold && line.length >= 8) {
                toRemove.add(line);
            }
        });
        
        return toRemove;
    }
    
    isListMarker(line) {
        const stripped = line.trim();
        // Bullet lists: - , • , * , · 
        if (/^\s*([-•*·])\s+/.test(stripped)) return true;
        // Ordered lists: 1. , 1) , etc.
        if (/^\s*\d+[.)]\s+/.test(stripped)) return true;
        return false;
    }
    
    detectTableBlock(lines, startIdx) {
        // Detect table-like blocks: ≥3 consecutive lines with ≥2 runs of ≥2 spaces at similar positions
        if (startIdx >= lines.length - 2) return { isTable: false, endIdx: startIdx };
        
        const checkLines = lines.slice(startIdx, Math.min(startIdx + 10, lines.length)); // Check up to 10 lines
        let consecutiveTableLines = 0;
        const spacePatterns = [];
        
        for (let i = 0; i < checkLines.length; i++) {
            const line = checkLines[i];
            if (!line.trim()) break; // Empty line breaks table pattern
            
            // Find positions of multiple spaces (≥2 spaces)
            const matches = [];
            let match;
            const regex = / {2,}/g;
            while ((match = regex.exec(line)) !== null) {
                matches.push(match.index);
            }
            
            if (matches.length >= 2) {
                spacePatterns.push(matches);
                consecutiveTableLines++;
            } else {
                break;
            }
        }
        
        if (consecutiveTableLines >= 3) {
            // Check if space positions are similar across lines
            let similarPositions = 0;
            if (spacePatterns.length >= 3) {
                const firstPattern = spacePatterns[0];
                for (let i = 1; i < spacePatterns.length; i++) {
                    const pattern = spacePatterns[i];
                    // Check if at least 2 positions match (within ±2 chars)
                    let matches = 0;
                    for (const pos of firstPattern) {
                        for (const pos2 of pattern) {
                            if (Math.abs(pos - pos2) <= 2) {
                                matches++;
                                break;
                            }
                        }
                    }
                    if (matches >= 2) similarPositions++;
                }
            }
            
            if (similarPositions >= 2) {
                return { isTable: true, endIdx: startIdx + consecutiveTableLines };
            }
        }
        
        return { isTable: false, endIdx: startIdx };
    }
    
    mergeBrokenLines(text) {
        if (!this.options.mergeBrokenLines) {
            return { text, linesMerged: 0 };
        }
        
        const lines = text.split('\n');
        const mergedLines = [];
        let linesMerged = 0;
        let tableBlockEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            // Check if we're in a table block
            if (i >= tableBlockEnd) {
                const tableCheck = this.detectTableBlock(lines, i);
                if (tableCheck.isTable) {
                    tableBlockEnd = tableCheck.endIdx;
                }
            }
            
            // Skip merge if in table block
            if (i < tableBlockEnd) {
                mergedLines.push(lines[i]);
                continue;
            }
            
            // Check if we should merge with previous line
            if (mergedLines.length > 0) {
                const prevLine = mergedLines[mergedLines.length - 1];
                const currentLine = lines[i];
                
                // Don't merge if previous line is empty
                if (!prevLine.trim()) {
                    mergedLines.push(currentLine);
                    continue;
                }
                
                // Don't merge if current line is empty
                if (!currentLine.trim()) {
                    mergedLines.push(currentLine);
                    continue;
                }
                
                // Merge conditions:
                // 1. Previous line doesn't end with [.!?]
                // 2. Current line doesn't start with list marker
                // 3. Next line (if exists) doesn't start with list marker (protect list context)
                
                const prevEndsWithPunct = /[.!?]\s*$/.test(prevLine);
                const nextIsList = i < lines.length - 1 && lines[i + 1].trim() && this.isListMarker(lines[i + 1]);
                const currentIsList = currentLine.trim() && this.isListMarker(currentLine);
                const prevIsHeader = this.isHeaderFooter(prevLine.trim()) || this.isPageNumber(prevLine.trim());
                const currentIsHeader = this.isHeaderFooter(currentLine.trim()) || this.isPageNumber(currentLine.trim());
                
                if (!prevEndsWithPunct && 
                    !currentIsList && 
                    !nextIsList &&
                    !prevIsHeader &&
                    !currentIsHeader) {
                    // Merge: remove newline, add space
                    mergedLines[mergedLines.length - 1] = prevLine.trimEnd() + ' ' + currentLine.trimStart();
                    linesMerged++;
                    continue;
                }
            }
            
            mergedLines.push(lines[i]);
        }
        
        return { text: mergedLines.join('\n'), linesMerged };
    }
    
    normalizeWhitespace(text, skipTableBlocks) {
        if (!this.options.normalizeWhitespace) {
            return { text, normalized: false };
        }
        
        const lines = text.split('\n');
        const normalizedLines = [];
        let tableBlockEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Check if we're in a table block
            if (skipTableBlocks && i >= tableBlockEnd) {
                const tableCheck = this.detectTableBlock(lines, i);
                if (tableCheck.isTable) {
                    tableBlockEnd = tableCheck.endIdx;
                }
            }
            
            // Skip normalization if in table block
            if (skipTableBlocks && i < tableBlockEnd) {
                normalizedLines.push(line);
                continue;
            }
            
            // Normalize whitespace
            // Collapse multiple spaces to single space
            line = line.replace(/\s+/g, ' ');
            // Normalize tabs to spaces
            line = line.replace(/\t/g, ' ');
            // Trim trailing spaces
            line = line.replace(/\s+$/, '');
            
            normalizedLines.push(line);
        }
        
        return { text: normalizedLines.join('\n'), normalized: true };
    }
    
    normalizeUnicodePunctuation(text) {
        if (!this.options.normalizeUnicode) {
            return { text, normalized: false };
        }
        
        // Limited Unicode normalization: only common punctuation
        // Map curly quotes to straight quotes, en/em dashes to hyphen
        const unicodeMap = {
            // Curly quotes
            '\u201C': '"', // Left double quotation mark
            '\u201D': '"', // Right double quotation mark
            '\u2018': "'", // Left single quotation mark
            '\u2019': "'", // Right single quotation mark
            // Dashes
            '\u2013': '-', // En dash
            '\u2014': '-', // Em dash
            // Other common punctuation
            '\u2026': '...', // Horizontal ellipsis
        };
        
        let normalized = text;
        let replacements = 0;
        
        for (const [unicode, ascii] of Object.entries(unicodeMap)) {
            const regex = new RegExp(unicode, 'g');
            const matches = normalized.match(regex);
            if (matches) {
                replacements += matches.length;
            }
            normalized = normalized.replace(regex, ascii);
        }
        
        return { text: normalized, normalized: replacements > 0, replacements };
    }

    cleanText(text) {
        if (!text) return { text: '', stats: this.getEmptyStats() };
        
        // Apply dehyphenation first (before line-by-line processing)
        const dehyphenResult = this.dehyphenateText(text);
        text = dehyphenResult.text;
        
        // FIRST: Remove headers/footers/page numbers BEFORE merge (to avoid merging them with content)
        let lines = text.split('\n');
        const preMergeLines = [];
        let headerFooterRemovedBeforeMerge = 0;
        
        // Detect repeating headers/footers across pages (before merge)
        const pageBoundaries = this.detectPages(text);
        const repeatingHeadersFooters = this.detectRepeatingHeadersFooters(text, pageBoundaries);
        
        // Track if previous line was removed (to avoid leaving multiple empty lines)
        let prevLineRemoved = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.trim();
            
            // Check if this line should be removed
            let shouldRemove = false;
            
            // Skip headers/footers (if enabled) - BEFORE merge
            if (this.options.removeHeadersFooters && this.isHeaderFooter(stripped)) {
                headerFooterRemovedBeforeMerge++;
                shouldRemove = true;
            }
            
            // Skip page numbers (if enabled) - BEFORE merge
            if (!shouldRemove && this.options.removePageNumbers && this.isPageNumber(stripped)) {
                headerFooterRemovedBeforeMerge++;
                shouldRemove = true;
            }
            
            // Skip repeating headers/footers across pages (if enabled) - BEFORE merge
            if (!shouldRemove && this.options.removeRepeatingHeadersFooters && repeatingHeadersFooters.has(stripped)) {
                headerFooterRemovedBeforeMerge++;
                shouldRemove = true;
            }
            
            if (shouldRemove) {
                prevLineRemoved = true;
                continue;
            }
            
            // If previous line was removed and this is empty, skip it to avoid double empty lines
            if (prevLineRemoved && !stripped) {
                prevLineRemoved = false;
                continue;
            }
            
            prevLineRemoved = false;
            preMergeLines.push(line);
        }
        
        text = preMergeLines.join('\n');
        
        // Apply merge broken lines ONLY if enabled (after removing headers/footers)
        const mergeResult = this.mergeBrokenLines(text);
        text = mergeResult.text;
        
        // Apply whitespace normalization ONLY if enabled (with table protection if enabled)
        const whitespaceResult = this.normalizeWhitespace(text, this.options.keepTableSpacing);
        text = whitespaceResult.text;
        
        // Apply Unicode punctuation normalization ONLY if enabled (limited, only punctuation)
        const unicodeResult = this.normalizeUnicodePunctuation(text);
        text = unicodeResult.text;

        // SECOND: Process remaining lines for other cleaning operations
        lines = text.split('\n');
        const cleanedLines = [];
        let prevLine = null;
        let prevNonEmptyLine = null;
        const stats = {
            linesRemoved: 0,
            duplicatesCollapsed: 0,
            emptyLinesRemoved: 0,
            headerFooterRemoved: headerFooterRemovedBeforeMerge, // Include headers/footers removed before merge
            punctuationLinesRemoved: 0,
            dehyphenatedTokens: dehyphenResult.tokensFixed,
            repeatingHeadersFootersRemoved: 0,
            mergedLines: mergeResult.linesMerged,
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.trim();

            // Skip empty or whitespace-only lines (if enabled)
            if (!stripped) {
                if (this.options.removeEmptyLines) {
                    // If preserving paragraph spacing, keep one empty line after non-empty lines
                    if (this.options.preserveParagraphSpacing && prevNonEmptyLine !== null) {
                        // Check if next line is non-empty
                        let nextNonEmptyIdx = i + 1;
                        while (nextNonEmptyIdx < lines.length && !lines[nextNonEmptyIdx].trim()) {
                            nextNonEmptyIdx++;
                        }
                        
                        // If there's a non-empty line after this empty line, keep one empty line
                        if (nextNonEmptyIdx < lines.length && lines[nextNonEmptyIdx].trim()) {
                            cleanedLines.push(line);
                            prevNonEmptyLine = null; // Reset to prevent multiple empty lines
                            continue;
                        }
                    }
                    
                    stats.emptyLinesRemoved++;
                    continue;
                } else {
                    cleanedLines.push(line);
                    continue;
                }
            }

            // Skip punctuation-only lines (if enabled)
            if (this.options.removePunctuationLines && this.isPunctuationOnly(stripped)) {
                stats.punctuationLinesRemoved++;
                continue;
            }

            // Skip consecutive duplicates (if enabled)
            if (this.options.removeDuplicates && prevLine !== null && stripped === prevLine.trim()) {
                stats.duplicatesCollapsed++;
                continue;
            }

            cleanedLines.push(line);
            prevLine = line;
            prevNonEmptyLine = line;
        }

        stats.linesRemoved = lines.length - cleanedLines.length + headerFooterRemovedBeforeMerge;
        return {
            text: cleanedLines.join('\n'),
            stats: stats
        };
    }

    async extractTextFromDocx(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const zip = new JSZip();
                    
                    zip.loadAsync(arrayBuffer).then((zip) => {
                        return zip.file('word/document.xml').async('string');
                    }).then((xmlContent) => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(xmlContent, 'text/xml');
                        const textNodes = doc.getElementsByTagNameNS(
                            'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                            't'
                        );
                        
                        const textParts = [];
                        for (let node of textNodes) {
                            if (node.textContent) {
                                textParts.push(node.textContent);
                            }
                        }
                        
                        resolve(textParts.join('\n'));
                    }).catch(reject);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            // Check if PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                reject(new Error('PDF.js library not loaded. Please refresh the page.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    
                    // Set worker source for PDF.js
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    
                    // Load PDF document
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    
                    const textParts = [];
                    
                    // Extract text from all pages
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        
                        // Combine text items, preserving line structure
                        // Group items by their Y position to detect lines
                        const lines = [];
                        let currentLine = [];
                        let lastY = null;
                        
                        for (const item of textContent.items) {
                            const y = item.transform[5]; // Y position from transform matrix
                            
                            // If Y position changed significantly (new line), start new line
                            if (lastY !== null && Math.abs(y - lastY) > 5) {
                                if (currentLine.length > 0) {
                                    lines.push(currentLine.map(item => item.str).join(''));
                                    currentLine = [];
                                }
                            }
                            
                            currentLine.push(item);
                            lastY = y;
                        }
                        
                        // Add last line
                        if (currentLine.length > 0) {
                            lines.push(currentLine.map(item => item.str).join(''));
                        }
                        
                        textParts.push(lines.join('\n'));
                        
                        // Add page break between pages (except last page)
                        if (pageNum < pdf.numPages) {
                            textParts.push('');
                        }
                    }
                    
                    resolve(textParts.join('\n'));
                } catch (error) {
                    reject(new Error(`Failed to extract text from PDF: ${error.message}`));
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            if (file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file, 'UTF-8');
            } else if (file.name.endsWith('.docx')) {
                this.extractTextFromDocx(file).then(resolve).catch(reject);
            } else if (file.name.endsWith('.pdf')) {
                this.extractTextFromPDF(file).then(resolve).catch(reject);
            } else {
                reject(new Error('Unsupported file type'));
            }
        });
    }

    async processFile(file) {
        try {
            const text = await this.readTextFile(file);
            const result = this.cleanText(text);
            return {
                fileName: file.name,
                originalText: text,
                cleanedText: result.text,
                stats: result.stats,
                success: true
            };
        } catch (error) {
            return {
                fileName: file.name,
                error: error.message,
                success: false
            };
        }
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

// Smart Cleaner using WebLLM
class SmartCleaner {
    constructor() {
        this.engine = null;
        this.isLoading = false;
        this.isCancelled = false;
        this.progressCallback = null;
        // Using a small, efficient model - Qwen2.5-0.5B is compact and fast
        // Fallback to TinyLlama if Qwen not available
        this.modelId = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
        this.fallbackModelId = 'TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC';
        // Settings for customizing cleaning behavior
        this.settings = {
            removeEmptyLines: true,
            removePageNumbers: true,
            removeHeadersFooters: true,
            removeDuplicates: true,
            removePunctuationLines: true,
            preserveParagraphSpacing: true,
            dehyphenate: true,
            mergeBrokenLines: false,
            normalizeWhitespace: false,
            keepTableSpacing: true,
            cleaningModeType: 'conservative', // 'conservative' or 'aggressive'
        };
    }
    
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }

    async checkWebGPUSupport() {
        if (!navigator.gpu) {
            return false;
        }
        try {
            const adapter = await navigator.gpu.requestAdapter();
            return adapter !== null;
        } catch (e) {
            return false;
        }
    }

    async ensureEngine() {
        if (this.engine) return this.engine;
        if (this.isLoading) {
            // Wait for ongoing load
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.engine;
        }

        this.isLoading = true;
        this.isCancelled = false;

        try {
            const hasWebGPU = await this.checkWebGPUSupport();
            if (!hasWebGPU) {
                throw new Error('WebGPU not supported');
            }

            // Dynamically import WebLLM
            // Note: WebLLM may require specific setup or CDN configuration
            // For production, consider bundling WebLLM or using a specific CDN
            const webllm = await import('https://esm.run/@mlc-ai/web-llm');
            
            // WebLLM API may vary - try different possible export names
            const CreateEngine = webllm.CreateMLCEngine || 
                                webllm.default?.CreateMLCEngine || 
                                webllm.createEngine ||
                                webllm.default;

            if (!CreateEngine || typeof CreateEngine !== 'function') {
                throw new Error('WebLLM CreateMLCEngine not found. Please check WebLLM import.');
            }

            this.updateProgress(10, 'Loading model...');

            // Try primary model first
            try {
                this.engine = await CreateEngine(
                    this.modelId,
                    {
                        gpuMemoryUtilization: 0.7,
                        progressCallback: (progress) => {
                            // Progress callback format may vary by WebLLM version
                            if (progress && typeof progress.loaded === 'number' && typeof progress.total === 'number') {
                                const progressPercent = Math.min((progress.loaded / progress.total) * 90 + 10, 90);
                                this.updateProgress(progressPercent, `Loading model weights... ${Math.round(progressPercent)}%`);
                            } else if (typeof progress === 'number') {
                                // Some versions pass progress as a number 0-100
                                this.updateProgress(progress, `Loading model weights... ${Math.round(progress)}%`);
                            } else {
                                // Fallback progress indication
                                this.updateProgress(50, 'Loading model...');
                            }
                        }
                    }
                );
            } catch (e) {
                console.warn('Primary model failed, trying fallback:', e);
                this.updateProgress(20, 'Trying fallback model...');
                this.engine = await CreateEngine(
                    this.fallbackModelId,
                    {
                        gpuMemoryUtilization: 0.7,
                        progressCallback: (progress) => {
                            if (progress && typeof progress.loaded === 'number' && typeof progress.total === 'number') {
                                const progressPercent = Math.min((progress.loaded / progress.total) * 90 + 10, 90);
                                this.updateProgress(progressPercent, `Loading model weights... ${Math.round(progressPercent)}%`);
                            } else if (typeof progress === 'number') {
                                this.updateProgress(progress, `Loading model weights... ${Math.round(progress)}%`);
                            } else {
                                this.updateProgress(50, 'Loading model...');
                            }
                        }
                    }
                );
            }

            this.updateProgress(100, 'Model loaded!');
            this.isLoading = false;
            return this.engine;
        } catch (error) {
            this.isLoading = false;
            console.error('Failed to load WebLLM:', error);
            throw error;
        }
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    updateProgress(percent, text) {
        if (this.progressCallback) {
            this.progressCallback(percent, text);
        }
    }

    cancel() {
        this.isCancelled = true;
    }

    chunkText(text, maxChunkSize = 3000) {
        const lines = text.split('\n');
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        let globalLineIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const lineSize = lines[i].length + 1; // +1 for newline
            if (currentSize + lineSize > maxChunkSize && currentChunk.length > 0) {
                chunks.push({
                    lines: currentChunk,
                    startIndex: globalLineIndex - currentChunk.length
                });
                currentChunk = [];
                currentSize = 0;
            }
            currentChunk.push(lines[i]);
            currentSize += lineSize;
            globalLineIndex++;
        }

        if (currentChunk.length > 0) {
            chunks.push({
                lines: currentChunk,
                startIndex: globalLineIndex - currentChunk.length
            });
        }

        return chunks;
    }

    buildPromptForChunk(chunk) {
        const linesWithIndices = chunk.lines.map((line, idx) => {
            const globalIdx = chunk.startIndex + idx;
            return `${globalIdx}: ${line}`;
        }).join('\n');

        // Build dynamic instructions based on settings
        const removeInstructions = [];
        const preserveInstructions = [];
        
        if (this.settings.removePageNumbers) {
            removeInstructions.push('- Page numbers: standalone digits (1, 2, 3), Roman numerals (I, II, III), single letters (A, B, C)');
        }
        
        if (this.settings.removeHeadersFooters) {
            removeInstructions.push('- Headers/footers: "Page X of Y", "Confidential", "DRAFT", "Internal Use Only", "PROPRIETARY", etc.');
        }
        
        if (this.settings.removePunctuationLines) {
            removeInstructions.push('- Punctuation-only lines: lines with only symbols (---, ***, ===, ___, etc.)');
        }
        
        if (this.settings.removeDuplicates) {
            removeInstructions.push('- Consecutive duplicates: if line N is identical to line N-1, drop line N (keep first occurrence)');
        }
        
        if (this.settings.removeEmptyLines) {
            if (this.settings.preserveParagraphSpacing) {
                removeInstructions.push('- Extra empty lines: if there are 2+ consecutive empty lines, keep only one between paragraphs');
            } else {
                removeInstructions.push('- Empty lines: remove all empty/whitespace-only lines');
            }
        }
        
        preserveInstructions.push('- All content text (sentences, paragraphs, meaningful text)');
        if (this.settings.preserveParagraphSpacing) {
            preserveInstructions.push('- One empty line between paragraphs (for spacing)');
        }
        preserveInstructions.push('- Structure and formatting of actual content');
        
        // Build rules section
        const rules = [];
        
        // Add mode-specific guidance
        const modeGuidance = this.settings.cleaningModeType === 'aggressive' 
            ? 'AGGRESSIVE MODE: Be thorough in cleaning. You can merge broken lines and normalize formatting when appropriate.'
            : 'CONSERVATIVE MODE: Be cautious and preserve structure. When in doubt, keep content. Do not merge lines or normalize formatting aggressively.';
        
        rules.push(`0. MODE: ${modeGuidance}`);
        
        if (this.settings.removeDuplicates) {
            rules.push('1. For consecutive duplicate lines: keep the FIRST occurrence, drop subsequent ones');
        }
        if (this.settings.removeEmptyLines) {
            if (this.settings.preserveParagraphSpacing) {
                rules.push('2. Empty lines: preserve ONE empty line between non-empty paragraphs, drop multiple empty lines');
            } else {
                rules.push('2. Empty lines: remove ALL empty lines');
            }
        }
        if (this.settings.removePageNumbers) {
            rules.push('3. Page numbers: drop ONLY if the entire line is just a number/letter (e.g., "1", "III", "A")');
        }
        rules.push('4. Keep ALL meaningful content - when in doubt, use "keep"');

        const systemPrompt = `You are a document cleaning assistant. Analyze each line and decide whether to keep, drop, or replace it.

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanations, no comments. Only JSON.

ACTIONS:
- "keep": Preserve the line exactly as-is (for content text)
- "drop": Remove the line completely (for noise: page numbers, headers, footers, duplicates, punctuation-only lines)
- "replace": Change the line text (use ONLY for fixing formatting issues, very rarely)

${removeInstructions.length > 0 ? `REMOVE (use "drop"):
${removeInstructions.join('\n')}` : 'REMOVE: Nothing (all cleaning options are disabled - only preserve content)'}

PRESERVE (use "keep"):
${preserveInstructions.join('\n')}

IMPORTANT RULES:
${rules.join('\n')}

JSON FORMAT (strict):
{
  "lines": [
    {"i": 0, "action": "keep"},
    {"i": 1, "action": "drop"},
    {"i": 2, "action": "keep"},
    {"i": 3, "action": "replace", "text": "Fixed text"}
  ]
}

EXAMPLES:

Example 1:
Input:
0: Page 1 of 10
1: Confidential
2: 
3: This is important content.
4: This is important content.
5: 
6: More content here.

Expected JSON:
{"lines":[
  {"i":0,"action":"drop"},
  {"i":1,"action":"drop"},
  {"i":2,"action":"keep"},
  {"i":3,"action":"keep"},
  {"i":4,"action":"drop"},
  {"i":5,"action":"keep"},
  {"i":6,"action":"keep"}
]}

Example 2:
Input:
0: Introduction
1: 
2: 
3: Main paragraph here.
4: ---
5: 1
6: 2
7: Conclusion

Expected JSON:
{"lines":[
  {"i":0,"action":"keep"},
  {"i":1,"action":"keep"},
  {"i":2,"action":"drop"},
  {"i":3,"action":"keep"},
  {"i":4,"action":"drop"},
  {"i":5,"action":"drop"},
  {"i":6,"action":"drop"},
  {"i":7,"action":"keep"}
]}`;

        const userPrompt = `Return JSON with action for each line. Process ALL lines in order.

Lines with indices:
${linesWithIndices}

Respond with JSON only:`;

        return { systemPrompt, userPrompt };
    }

    safeParseJSON(jsonString) {
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('JSON parse error:', e, 'Raw:', jsonString);
            return null;
        }
    }

    applyPlan(chunk, plan) {
        if (!plan || !plan.lines || !Array.isArray(plan.lines)) {
            return chunk.lines.join('\n');
        }

        const result = [];
        const planMap = new Map();
        plan.lines.forEach(item => {
            if (item.i !== undefined && item.action) {
                planMap.set(item.i, item);
            }
        });

        chunk.lines.forEach((line, idx) => {
            const globalIdx = chunk.startIndex + idx;
            const planItem = planMap.get(globalIdx);

            if (!planItem) {
                result.push(line);
                return;
            }

            switch (planItem.action) {
                case 'keep':
                    result.push(line);
                    break;
                case 'drop':
                    // Skip this line
                    break;
                case 'replace':
                    result.push(planItem.text || line);
                    break;
                default:
                    result.push(line);
            }
        });

        return result.join('\n');
    }

    // Post-processing methods (similar to DocStripper but adapted for SmartCleaner)
    dehyphenateText(text) {
        if (!text || !this.settings.dehyphenate) {
            return { text: text || '', tokensFixed: 0 };
        }
        
        // Count matches before replacement
        const matches = text.match(/-\n([a-z]{1,})/g);
        const tokensFixed = matches ? matches.length : 0;
        
        // Replace "-\n[a-z]" with just the lowercase part (safe dehyphenation)
        const dehyphenated = text.replace(/-\n([a-z]{1,})/g, '$1');
        
        return { text: dehyphenated, tokensFixed };
    }

    isListMarker(line) {
        const stripped = line.trim();
        // Bullet lists: - , • , * , · 
        if (/^\s*([-•*·])\s+/.test(stripped)) return true;
        // Ordered lists: 1. , 1) , etc.
        if (/^\s*\d+[.)]\s+/.test(stripped)) return true;
        return false;
    }

    detectTableBlock(lines, startIdx) {
        // Detect table-like blocks: ≥3 consecutive lines with ≥2 runs of ≥2 spaces at similar positions
        if (startIdx >= lines.length - 2) return { isTable: false, endIdx: startIdx };
        
        const checkLines = lines.slice(startIdx, Math.min(startIdx + 10, lines.length)); // Check up to 10 lines
        let consecutiveTableLines = 0;
        const spacePatterns = [];
        
        for (let i = 0; i < checkLines.length; i++) {
            const line = checkLines[i];
            if (!line.trim()) break; // Empty line breaks table pattern
            
            // Find positions of multiple spaces (≥2 spaces)
            const matches = [];
            let match;
            const regex = / {2,}/g;
            while ((match = regex.exec(line)) !== null) {
                matches.push(match.index);
            }
            
            if (matches.length >= 2) {
                spacePatterns.push(matches);
                consecutiveTableLines++;
            } else {
                break;
            }
        }
        
        if (consecutiveTableLines >= 3) {
            // Check if space positions are similar across lines
            let similarPositions = 0;
            for (let i = 0; i < spacePatterns.length - 1; i++) {
                const current = spacePatterns[i];
                const next = spacePatterns[i + 1];
                // Check if at least 2 positions are similar (within 3 chars)
                let matches = 0;
                for (const pos1 of current) {
                    for (const pos2 of next) {
                        if (Math.abs(pos1 - pos2) <= 3) {
                            matches++;
                            break;
                        }
                    }
                }
                if (matches >= 2) similarPositions++;
            }
            
            if (similarPositions >= 2) {
                // Find end of table block
                let endIdx = startIdx + consecutiveTableLines;
                // Extend if next lines also match pattern
                while (endIdx < lines.length && endIdx < startIdx + 50) { // Max 50 lines
                    const line = lines[endIdx];
                    if (!line.trim()) break;
                    const matches = line.match(/ {2,}/g);
                    if (matches && matches.length >= 2) {
                        endIdx++;
                        consecutiveTableLines++;
                    } else {
                        break;
                    }
                }
                return { isTable: true, endIdx };
            }
        }
        
        return { isTable: false, endIdx: startIdx };
    }

    mergeBrokenLines(text) {
        if (!this.settings.mergeBrokenLines) {
            return { text, linesMerged: 0 };
        }
        
        const lines = text.split('\n');
        const mergedLines = [];
        let linesMerged = 0;
        let tableBlockEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            // Check if we're in a table block
            if (i >= tableBlockEnd) {
                const tableCheck = this.detectTableBlock(lines, i);
                if (tableCheck.isTable) {
                    tableBlockEnd = tableCheck.endIdx;
                }
            }
            
            // Skip merge if in table block
            if (i < tableBlockEnd) {
                mergedLines.push(lines[i]);
                continue;
            }
            
            // Check if we should merge with previous line
            if (mergedLines.length > 0) {
                const prevLine = mergedLines[mergedLines.length - 1];
                const currentLine = lines[i];
                
                // Don't merge if previous line is empty
                if (!prevLine.trim()) {
                    mergedLines.push(currentLine);
                    continue;
                }
                
                // Don't merge if current line is empty
                if (!currentLine.trim()) {
                    mergedLines.push(currentLine);
                    continue;
                }
                
                // Merge conditions:
                // 1. Previous line doesn't end with [.!?]
                // 2. Current line doesn't start with list marker
                // 3. Next line (if exists) doesn't start with list marker (protect list context)
                
                const prevEndsWithPunct = /[.!?]\s*$/.test(prevLine);
                const nextIsList = i < lines.length - 1 && lines[i + 1].trim() && this.isListMarker(lines[i + 1]);
                const currentIsList = currentLine.trim() && this.isListMarker(currentLine);
                const prevIsHeader = this.isHeaderFooter(prevLine.trim()) || this.isPageNumber(prevLine.trim());
                const currentIsHeader = this.isHeaderFooter(currentLine.trim()) || this.isPageNumber(currentLine.trim());
                
                if (!prevEndsWithPunct && 
                    !currentIsList && 
                    !nextIsList &&
                    !prevIsHeader &&
                    !currentIsHeader) {
                    // Merge: remove newline, add space
                    mergedLines[mergedLines.length - 1] = prevLine.trimEnd() + ' ' + currentLine.trimStart();
                    linesMerged++;
                    continue;
                }
            }
            
            mergedLines.push(lines[i]);
        }
        
        return { text: mergedLines.join('\n'), linesMerged };
    }

    normalizeWhitespace(text, skipTableBlocks) {
        if (!this.settings.normalizeWhitespace) {
            return { text, normalized: false };
        }
        
        const lines = text.split('\n');
        const normalizedLines = [];
        let tableBlockEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Check if we're in a table block
            if (skipTableBlocks && i >= tableBlockEnd) {
                const tableCheck = this.detectTableBlock(lines, i);
                if (tableCheck.isTable) {
                    tableBlockEnd = tableCheck.endIdx;
                }
            }
            
            // Skip normalization if in table block
            if (skipTableBlocks && i < tableBlockEnd) {
                normalizedLines.push(line);
                continue;
            }
            
            // Normalize whitespace
            // Collapse multiple spaces to single space
            line = line.replace(/\s+/g, ' ');
            // Normalize tabs to spaces
            line = line.replace(/\t/g, ' ');
            // Trim trailing spaces
            line = line.replace(/\s+$/, '');
            
            normalizedLines.push(line);
        }
        
        return { text: normalizedLines.join('\n'), normalized: true };
    }

    async cleanText(text, settings = null) {
        if (!text) return { text: '', stats: this.getEmptyStats() };

        // Update settings if provided
        if (settings) {
            this.setSettings(settings);
        }

        try {
            const engine = await this.ensureEngine();
            if (this.isCancelled) {
                throw new Error('Cancelled by user');
            }

            // Adaptive chunk size based on text length
            const textLength = text.length;
            const maxChunkSize = textLength > 50000 ? 4000 : textLength > 20000 ? 3500 : 3000;
            const chunks = this.chunkText(text, maxChunkSize);
            
            if (chunks.length === 0) {
                return { text: text, stats: this.getEmptyStats() };
            }
            
            let result = [];
            const stats = {
                linesRemoved: 0,
                duplicatesCollapsed: 0,
                emptyLinesRemoved: 0,
                headerFooterRemoved: 0,
                punctuationLinesRemoved: 0,
            };

            const originalLineCount = text.split('\n').length;
            const totalChunks = chunks.length;
            
            // Process chunks in batches for better performance
            const batchSize = 3;
            for (let batchStart = 0; batchStart < totalChunks; batchStart += batchSize) {
                if (this.isCancelled) {
                    throw new Error('Cancelled by user');
                }

                const batchEnd = Math.min(batchStart + batchSize, totalChunks);
                const batch = chunks.slice(batchStart, batchEnd);
                
                // Process batch in parallel, preserving order
                const batchPromises = batch.map(async (chunk, batchIdx) => {
                    const chunkIdx = batchStart + batchIdx;
                    const progressPercent = Math.floor((chunkIdx / totalChunks) * 100);
                    this.updateProgress(progressPercent, `Processing chunk ${chunkIdx + 1}/${totalChunks}...`);

                    try {
                        const { systemPrompt, userPrompt } = this.buildPromptForChunk(chunk);

                        const reply = await engine.chat.completions.create({
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt }
                            ],
                            temperature: 0.2,
                            max_tokens: 2000
                        });

                        const content = reply.choices?.[0]?.message?.content ?? '{}';
                        const plan = this.safeParseJSON(content);

                        if (!plan) {
                            console.warn(`Failed to parse LLM response for chunk ${chunkIdx + 1}, using original chunk`);
                            return { index: chunkIdx, text: chunk.lines.join('\n') };
                        } else {
                            return { index: chunkIdx, text: this.applyPlan(chunk, plan) };
                        }
                    } catch (error) {
                        console.error(`Error processing chunk ${chunkIdx + 1}:`, error);
                        return { index: chunkIdx, text: chunk.lines.join('\n') }; // Fallback to original
                    }
                });

                // Wait for batch to complete (Promise.all preserves order)
                const batchResults = await Promise.all(batchPromises);
                
                // Sort by index to ensure correct order (extra safety)
                batchResults.sort((a, b) => a.index - b.index);
                
                // Add results in order
                for (const batchResult of batchResults) {
                    result.push(batchResult.text);
                }

                // Small delay between batches to prevent UI freezing
                if (batchEnd < totalChunks) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            let cleanedText = result.join('\n');
            const cleanedLineCount = cleanedText.split('\n').length;
            stats.linesRemoved = originalLineCount - cleanedLineCount;

            // Validate result is not empty
            if (!cleanedText.trim() && text.trim()) {
                console.warn('Smart clean produced empty result, using original text');
                return { text: text, stats: this.getEmptyStats() };
            }

            // Apply post-processing operations (dehyphenation, merge lines, normalize whitespace)
            // These are applied after LLM processing to ensure consistent behavior with Fast Clean mode
            
            // 1. Dehyphenation
            if (this.settings.dehyphenate) {
                const dehyphenResult = this.dehyphenateText(cleanedText);
                cleanedText = dehyphenResult.text;
                stats.dehyphenatedTokens = dehyphenResult.tokensFixed || 0;
            }
            
            // 2. Merge broken lines (if enabled)
            if (this.settings.mergeBrokenLines) {
                const mergeResult = this.mergeBrokenLines(cleanedText);
                cleanedText = mergeResult.text;
                stats.mergedLines = mergeResult.linesMerged || 0;
            }
            
            // 3. Normalize whitespace (if enabled, with table protection)
            if (this.settings.normalizeWhitespace) {
                const whitespaceResult = this.normalizeWhitespace(cleanedText, this.settings.keepTableSpacing);
                cleanedText = whitespaceResult.text;
            }

            return {
                text: cleanedText,
                stats: stats
            };
        } catch (error) {
            console.error('Smart clean error:', error);
            throw error;
        }
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
class App {
    constructor() {
        // Initialize with default settings (all enabled)
        this.stripper = new DocStripper({
            removeEmptyLines: true,
            removePageNumbers: true,
            removeHeadersFooters: true,
            removeDuplicates: true,
            removePunctuationLines: true,
            preserveParagraphSpacing: true,
        });
        this.smartCleaner = new SmartCleaner();
        this.files = [];
        this.results = [];
        this.cleaningMode = 'fast'; // 'fast' or 'smart'
        this.cleaningModeType = 'conservative'; // 'conservative' or 'aggressive'
        this.initializeElements();
        this.loadSettings(); // Load saved settings from localStorage
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        
        // Download All container will be inserted above results dynamically
        
        // Start button
        this.startBtn = document.getElementById('startBtn');
        this.autoStartAfterUpload = document.getElementById('autoStartAfterUpload');
        
        // Mode selection
        this.fastMode = document.getElementById('fastMode');
        this.smartMode = document.getElementById('smartMode');
        this.smartModeWarning = document.getElementById('smartModeWarning');
        this.smartProgress = document.getElementById('smartProgress');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.modeNote = document.getElementById('modeNote');
        
        // Cleaning mode type (Conservative/Aggressive)
        this.conservativeMode = document.getElementById('conservativeMode');
        this.aggressiveMode = document.getElementById('aggressiveMode');
        
        // Settings checkboxes
        this.removeEmptyLines = document.getElementById('removeEmptyLines');
        this.removePageNumbers = document.getElementById('removePageNumbers');
        this.removeHeadersFooters = document.getElementById('removeHeadersFooters');
        // removeRepeatingHeadersFooters is now automatically enabled when removeHeadersFooters is enabled
        this.removeDuplicates = document.getElementById('removeDuplicates');
        this.removePunctuationLines = document.getElementById('removePunctuationLines');
        this.dehyphenate = document.getElementById('dehyphenate');
        this.preserveParagraphSpacing = document.getElementById('preserveParagraphSpacing');
        this.mergeBrokenLines = document.getElementById('mergeBrokenLines');
        this.normalizeWhitespace = document.getElementById('normalizeWhitespace');
        this.keepTableSpacing = document.getElementById('keepTableSpacing');
        
        // Check if elements exist
        if (!this.uploadArea || !this.fileInput) {
            console.error('Required elements not found');
            return;
        }
        
        // Setup progress callback for SmartCleaner
        this.smartCleaner.setProgressCallback((percent, text) => {
            this.updateProgress(percent, text);
        });
        
        // Ensure file input is styled correctly
        this.fileInput.style.position = 'absolute';
        this.fileInput.style.top = '0';
        this.fileInput.style.left = '0';
        this.fileInput.style.width = '100%';
        this.fileInput.style.height = '100%';
        this.fileInput.style.opacity = '0';
        this.fileInput.style.cursor = 'pointer';
        this.fileInput.style.zIndex = '10';
        this.fileInput.style.fontSize = '0';
        this.fileInput.style.pointerEvents = 'auto'; // Chrome compatibility
        this.fileInput.setAttribute('tabindex', '-1'); // Make it focusable but not in tab order
        
        // Ensure upload area has overflow hidden
        this.uploadArea.style.overflow = 'hidden';
        
        // Remove Clear All button if it exists (should not exist, but cleanup)
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.remove();
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('docstripper_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Restore cleaning mode type
                if (settings.cleaningModeType) {
                    this.cleaningModeType = settings.cleaningModeType;
                    if (this.conservativeMode && this.aggressiveMode) {
                        if (settings.cleaningModeType === 'aggressive') {
                            this.aggressiveMode.checked = true;
                        } else {
                            this.conservativeMode.checked = true;
                        }
                    }
                }
                
                // Restore cleaning mode (fast/smart)
                if (settings.cleaningMode) {
                    this.cleaningMode = settings.cleaningMode;
                    if (this.fastMode && this.smartMode) {
                        if (settings.cleaningMode === 'smart') {
                            this.smartMode.checked = true;
                        } else {
                            this.fastMode.checked = true;
                        }
                    }
                }
                
                // Restore auto-start
                if (settings.autoStartAfterUpload !== undefined && this.autoStartAfterUpload) {
                    this.autoStartAfterUpload.checked = !!settings.autoStartAfterUpload;
                }
                
                // Restore checkbox states
                if (settings.removeEmptyLines !== undefined && this.removeEmptyLines) {
                    this.removeEmptyLines.checked = settings.removeEmptyLines;
                }
                if (settings.removePageNumbers !== undefined && this.removePageNumbers) {
                    this.removePageNumbers.checked = settings.removePageNumbers;
                }
                if (settings.removeHeadersFooters !== undefined && this.removeHeadersFooters) {
                    this.removeHeadersFooters.checked = settings.removeHeadersFooters;
                }
                // removeRepeatingHeadersFooters is now automatically enabled when removeHeadersFooters is enabled
                if (settings.removeDuplicates !== undefined && this.removeDuplicates) {
                    this.removeDuplicates.checked = settings.removeDuplicates;
                }
                if (settings.removePunctuationLines !== undefined && this.removePunctuationLines) {
                    this.removePunctuationLines.checked = settings.removePunctuationLines;
                }
                if (settings.preserveParagraphSpacing !== undefined && this.preserveParagraphSpacing) {
                    this.preserveParagraphSpacing.checked = settings.preserveParagraphSpacing;
                }
                if (settings.dehyphenate !== undefined && this.dehyphenate) {
                    this.dehyphenate.checked = settings.dehyphenate;
                }
                if (settings.mergeBrokenLines !== undefined && this.mergeBrokenLines) {
                    this.mergeBrokenLines.checked = settings.mergeBrokenLines;
                }
                if (settings.normalizeWhitespace !== undefined && this.normalizeWhitespace) {
                    this.normalizeWhitespace.checked = settings.normalizeWhitespace;
                }
                if (settings.keepTableSpacing !== undefined && this.keepTableSpacing) {
                    this.keepTableSpacing.checked = settings.keepTableSpacing;
                }
                
                // Update mode UI
                this.updateModeUI();
            } else {
                // Apply default Conservative mode settings
                this.applyModeDefaults();
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
            this.applyModeDefaults();
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                cleaningModeType: this.cleaningModeType,
                cleaningMode: this.cleaningMode,
                removeEmptyLines: this.removeEmptyLines?.checked ?? true,
                removePageNumbers: this.removePageNumbers?.checked ?? true,
                removeHeadersFooters: this.removeHeadersFooters?.checked ?? true,
                removeRepeatingHeadersFooters: this.removeHeadersFooters?.checked ?? true, // Automatically enabled when removeHeadersFooters is enabled
                removeDuplicates: this.removeDuplicates?.checked ?? true,
                removePunctuationLines: this.removePunctuationLines?.checked ?? true,
                preserveParagraphSpacing: this.preserveParagraphSpacing?.checked ?? true,
                dehyphenate: this.dehyphenate?.checked ?? true,
                mergeBrokenLines: this.mergeBrokenLines?.checked ?? false,
                normalizeWhitespace: this.normalizeWhitespace?.checked ?? false,
                keepTableSpacing: this.keepTableSpacing?.checked ?? true,
                autoStartAfterUpload: this.autoStartAfterUpload?.checked ?? false,
            };
            localStorage.setItem('docstripper_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }
    
    applyModeDefaults() {
        if (this.cleaningModeType === 'aggressive') {
            // Aggressive mode defaults
            if (this.removeEmptyLines) this.removeEmptyLines.checked = true;
            if (this.removePageNumbers) this.removePageNumbers.checked = true;
            if (this.removeHeadersFooters) this.removeHeadersFooters.checked = true;
            // removeRepeatingHeadersFooters is now automatically enabled when removeHeadersFooters is enabled
            if (this.removeDuplicates) this.removeDuplicates.checked = true;
            if (this.removePunctuationLines) this.removePunctuationLines.checked = true;
            if (this.preserveParagraphSpacing) this.preserveParagraphSpacing.checked = true;
            if (this.dehyphenate) this.dehyphenate.checked = true;
            if (this.mergeBrokenLines) this.mergeBrokenLines.checked = true; // ON in Aggressive
            if (this.normalizeWhitespace) this.normalizeWhitespace.checked = true; // ON in Aggressive
            if (this.keepTableSpacing) this.keepTableSpacing.checked = true;
        } else {
            // Conservative mode defaults (current behavior)
            if (this.removeEmptyLines) this.removeEmptyLines.checked = true;
            if (this.removePageNumbers) this.removePageNumbers.checked = true;
            if (this.removeHeadersFooters) this.removeHeadersFooters.checked = true;
            // removeRepeatingHeadersFooters is now automatically enabled when removeHeadersFooters is enabled
            if (this.removeDuplicates) this.removeDuplicates.checked = true;
            if (this.removePunctuationLines) this.removePunctuationLines.checked = true;
            if (this.preserveParagraphSpacing) this.preserveParagraphSpacing.checked = true;
            if (this.dehyphenate) this.dehyphenate.checked = true;
            if (this.mergeBrokenLines) this.mergeBrokenLines.checked = false; // OFF in Conservative
            if (this.normalizeWhitespace) this.normalizeWhitespace.checked = false; // OFF in Conservative
            if (this.keepTableSpacing) this.keepTableSpacing.checked = true;
        }
    }

    setupEventListeners() {
        // Chrome requires direct user interaction - make file input directly clickable
        // Ensure file input accepts clicks directly
        this.fileInput.addEventListener('click', (e) => {
            // Allow normal file input behavior
            e.stopPropagation();
        });
        
        // Handle clicks on upload area - Chrome compatibility
        this.uploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on remove button or other interactive elements
            if (e.target.closest('.remove-file') || e.target.closest('.btn')) {
                return;
            }
            
            // If click is directly on file input, allow it
            if (e.target === this.fileInput || e.target.closest('input[type="file"]')) {
                return;
            }
            
            // For Chrome: use direct click without setTimeout
            if (this.fileInput) {
                // Try direct click first (works in most browsers)
                try {
                    this.fileInput.click();
                } catch (err) {
                    // Fallback: trigger click event
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    this.fileInput.dispatchEvent(clickEvent);
                }
            }
        });
        
        // Also handle mousedown for Chrome - Chrome sometimes needs mousedown
        this.uploadArea.addEventListener('mousedown', (e) => {
            if (e.target.closest('.remove-file') || e.target.closest('.btn')) {
                return;
            }
            if (e.target === this.fileInput || e.target.closest('input[type="file"]')) {
                return;
            }
            
            // For Chrome: trigger click on mouseup (more reliable)
            const handleMouseUp = () => {
                if (this.fileInput) {
                    try {
                        this.fileInput.focus();
                        this.fileInput.click();
                    } catch (err) {
                        console.error('Error opening file dialog:', err);
                    }
                }
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Make upload-content clickable too (removes pointer-events: none issue)
        const uploadContent = this.uploadArea.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.fileInput) {
                    this.fileInput.click();
                }
            });
        }

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Start button click
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                if (this.files.length > 0) {
                    this.processFiles();
                }
            });
        }
        
        // Settings change - save settings and update start button state
        if (this.removeEmptyLines) {
            this.removeEmptyLines.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        if (this.removePageNumbers) {
            this.removePageNumbers.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        if (this.removeHeadersFooters) {
            this.removeHeadersFooters.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        // removeRepeatingHeadersFooters is now automatically enabled when removeHeadersFooters is enabled
        if (this.removeDuplicates) {
            this.removeDuplicates.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        if (this.removePunctuationLines) {
            this.removePunctuationLines.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        if (this.preserveParagraphSpacing) {
            this.preserveParagraphSpacing.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        if (this.dehyphenate) {
            this.dehyphenate.addEventListener('change', () => {
                this.saveSettings();
                this.updateStartButton();
            });
        }
        if (this.mergeBrokenLines) {
            this.mergeBrokenLines.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        if (this.normalizeWhitespace) {
            this.normalizeWhitespace.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        if (this.keepTableSpacing) {
            this.keepTableSpacing.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        if (this.autoStartAfterUpload) {
            this.autoStartAfterUpload.addEventListener('change', () => {
                this.saveSettings();
            });
        }
        
        // Mode type selection handlers (Conservative/Aggressive)
        if (this.conservativeMode) {
            this.conservativeMode.addEventListener('change', () => {
                if (this.conservativeMode.checked) {
                    this.cleaningModeType = 'conservative';
                    this.applyModeDefaults();
                    this.saveSettings();
                }
            });
        }
        if (this.aggressiveMode) {
            this.aggressiveMode.addEventListener('change', () => {
                if (this.aggressiveMode.checked) {
                    this.cleaningModeType = 'aggressive';
                    this.applyModeDefaults();
                    this.saveSettings();
                }
            });
        }
        
        // Mode selection handlers (Fast/Smart)
        if (this.fastMode) {
            this.fastMode.addEventListener('change', () => {
                if (this.fastMode.checked) {
                    this.cleaningMode = 'fast';
                    this.saveSettings();
                    this.updateModeUI();
                }
            });
        }
        if (this.smartMode) {
            this.smartMode.addEventListener('change', () => {
                if (this.smartMode.checked) {
                    this.cleaningMode = 'smart';
                    this.saveSettings();
                    this.updateModeUI();
                }
            });
        }
        
        // Cancel button handler
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                this.smartCleaner.cancel();
                this.hideProgress();
                this.showToast('Smart Clean cancelled', 'error');
            });
        }
    }
    
    updateModeUI() {
        if (this.cleaningMode === 'smart') {
            if (this.smartModeWarning) {
                this.smartModeWarning.style.display = 'flex';
            }
            if (this.modeNote) {
                this.modeNote.textContent = 'Smart Clean mode selected (AI-powered)';
            }
        } else {
            if (this.smartModeWarning) {
                this.smartModeWarning.style.display = 'none';
            }
            if (this.modeNote) {
                this.modeNote.textContent = 'Fast Clean mode selected';
            }
        }
        this.hideProgress();
    }
    
    updateProgress(percent, text) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = text || 'Processing...';
        }
        if (this.smartProgress) {
            this.smartProgress.style.display = 'block';
        }
        if (this.cancelBtn && percent > 0 && percent < 100) {
            this.cancelBtn.style.display = 'block';
        }
    }
    
    hideProgress() {
        if (this.smartProgress) {
            this.smartProgress.style.display = 'none';
        }
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        if (this.cancelBtn) {
            this.cancelBtn.style.display = 'none';
        }
    }

    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.name.endsWith('.txt') || file.name.endsWith('.docx') || file.name.endsWith('.pdf')
        );

        if (validFiles.length === 0) {
            this.showToast('Please upload .txt, .docx, or .pdf files only.', 'error');
            return;
        }

        this.files.push(...validFiles);
        this.updateFileList();
        // Don't process files automatically - wait for user to click START button
        
        // Reset file input to allow selecting the same file again
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        
        // Show start button if files are uploaded
        this.updateStartButton();
        
        // Scroll to the START button to prompt user action
        setTimeout(() => {
            if (this.startBtn) {
                this.startBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                const settingsSection = document.getElementById('settingsSection');
                if (settingsSection) {
                    settingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);
        
        // Auto-start if enabled
        if (this.autoStartAfterUpload && this.autoStartAfterUpload.checked && this.startBtn) {
            setTimeout(() => {
                if (this.files.length > 0) {
                    this.startBtn.click();
                }
            }, 150);
        }
    }

    updateStartButton() {
        if (this.startBtn) {
            if (this.files.length > 0) {
                this.startBtn.style.display = 'block';
                this.startBtn.disabled = false;
            } else {
                this.startBtn.style.display = 'none';
                this.startBtn.disabled = true;
            }
        }
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
            this.updateStartButton();
            return;
        }

        this.fileList.innerHTML = '<h3>Uploaded Files:</h3>';
        
        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${this.escapeHtml(file.name)}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
                <button class="remove-file" data-index="${index}" aria-label="Remove file">×</button>
            `;
            
            fileItem.querySelector('.remove-file').addEventListener('click', () => {
                this.files.splice(index, 1);
                this.updateFileList();
                if (this.files.length === 0) {
                    this.files = [];
                    this.results = [];
                    if (this.fileInput) {
                        this.fileInput.value = '';
                    }
                    this.updateFileList();
                    this.resultsSection.style.display = 'none';
                }
            });
            
            this.fileList.appendChild(fileItem);
        });
        
        this.updateStartButton();
    }

    async processFiles() {
        if (this.files.length === 0) {
            this.resultsSection.style.display = 'none';
            return;
        }

        const useSmartMode = this.cleaningMode === 'smart';
        
        // Get current settings from checkboxes (used for both Fast and Smart modes)
        const settings = {
            removeEmptyLines: this.removeEmptyLines ? this.removeEmptyLines.checked : true,
            removePageNumbers: this.removePageNumbers ? this.removePageNumbers.checked : true,
            removeHeadersFooters: this.removeHeadersFooters ? this.removeHeadersFooters.checked : true,
            removeRepeatingHeadersFooters: this.removeHeadersFooters ? this.removeHeadersFooters.checked : true, // Automatically enabled when removeHeadersFooters is enabled
            removeDuplicates: this.removeDuplicates ? this.removeDuplicates.checked : true,
            removePunctuationLines: this.removePunctuationLines ? this.removePunctuationLines.checked : true,
            preserveParagraphSpacing: this.preserveParagraphSpacing ? this.preserveParagraphSpacing.checked : true,
            dehyphenate: this.dehyphenate ? this.dehyphenate.checked : true,
            mergeBrokenLines: this.mergeBrokenLines ? this.mergeBrokenLines.checked : false,
            normalizeWhitespace: this.normalizeWhitespace ? this.normalizeWhitespace.checked : false,
            keepTableSpacing: this.keepTableSpacing ? this.keepTableSpacing.checked : true,
            cleaningModeType: this.cleaningModeType, // Pass mode type to SmartCleaner
        };

        // Create new stripper instance with current settings (for Fast mode or fallback)
        this.stripper = new DocStripper(settings);

        this.resultsSection.style.display = 'block';
        this.resultsContainer.innerHTML = '<div class="loading">Processing files...</div>';
        
        // Disable start button during processing
        if (this.startBtn) {
            this.startBtn.disabled = true;
        }
        
        // Scroll to results
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        const results = [];
        let totalStats = {
            filesProcessed: 0,
            linesRemoved: 0,
            duplicatesCollapsed: 0,
            emptyLinesRemoved: 0,
            headerFooterRemoved: 0,
            punctuationLinesRemoved: 0,
            dehyphenatedTokens: 0,
            repeatingHeadersFootersRemoved: 0,
            mergedLines: 0,
        };

        try {
            for (const file of this.files) {
                let result;
                
                if (useSmartMode) {
                    try {
                        // Use Smart Cleaner with current settings
                        const text = await this.stripper.readTextFile(file);
                        const cleanedResult = await this.smartCleaner.cleanText(text, settings);
                        
                        result = {
                            fileName: file.name,
                            originalText: text,
                            cleanedText: cleanedResult.text,
                            stats: cleanedResult.stats,
                            success: true,
                            mode: 'smart'
                        };
                    } catch (smartError) {
                        console.warn('Smart clean failed, falling back to Fast clean:', smartError);
                        // Fallback to Fast Clean
                        this.showToast('Smart Clean unavailable, using Fast Clean', 'error');
                        result = await this.stripper.processFile(file);
                        if (result.success) {
                            result.mode = 'fast-fallback';
                        }
                    }
                } else {
                    // Use Fast Cleaner
                    result = await this.stripper.processFile(file);
                    if (result.success) {
                        result.mode = 'fast';
                    }
                }
                
                results.push(result);
                
                if (result.success) {
                    totalStats.filesProcessed++;
                    totalStats.linesRemoved += result.stats.linesRemoved || 0;
                    totalStats.duplicatesCollapsed += result.stats.duplicatesCollapsed || 0;
                    totalStats.emptyLinesRemoved += result.stats.emptyLinesRemoved || 0;
                    totalStats.headerFooterRemoved += result.stats.headerFooterRemoved || 0;
                    totalStats.punctuationLinesRemoved += result.stats.punctuationLinesRemoved || 0;
                    totalStats.dehyphenatedTokens = (totalStats.dehyphenatedTokens || 0) + (result.stats.dehyphenatedTokens || 0);
                    totalStats.repeatingHeadersFootersRemoved = (totalStats.repeatingHeadersFootersRemoved || 0) + (result.stats.repeatingHeadersFootersRemoved || 0);
                    totalStats.mergedLines = (totalStats.mergedLines || 0) + (result.stats.mergedLines || 0);
                }
            }
        } finally {
            // Hide progress and re-enable button
            this.hideProgress();
            if (this.startBtn) {
                this.startBtn.disabled = false;
            }
        }

        this.results = results;
        this.displayResults(results, totalStats);
        
        // After results are rendered, scroll directly to the first Download button
        setTimeout(() => {
            const firstDownloadBtn = document.querySelector('.download-btn');
            if (firstDownloadBtn) {
                firstDownloadBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (this.resultsSection) {
                // Fallback: scroll to results section
                this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
    }

    // Virtualization helper for large texts
    createVirtualizedPreview(text, containerId, maxRenderSize = 1024 * 1024) {
        const needsVirtualization = text.length > maxRenderSize;
        const lines = text.split('\n');
        const totalLines = lines.length;
        
        if (!needsVirtualization) {
            // Simple rendering for small texts
            return `<pre class="text-preview-content">${this.escapeHtml(text)}</pre>`;
        }
        
        // Virtualized rendering for large texts
        const visibleRange = 200; // Render ~200 lines at a time
        
        // Create scrollable container
        const virtualizedHTML = `
            <div class="virtualized-container" data-total-lines="${totalLines}" data-container-id="${containerId}">
                <div class="virtualized-spacer-top" style="height: 0px;"></div>
                <pre class="text-preview-content virtualized-content"></pre>
                <div class="virtualized-spacer-bottom" style="height: 0px;"></div>
            </div>
        `;
        
        // Store lines data for later setup
        this._virtualizationData = this._virtualizationData || {};
        this._virtualizationData[containerId] = {
            lines: lines,
            visibleRange: visibleRange
        };
        
        // Setup scroll handler after DOM is ready
        setTimeout(() => {
            this.setupVirtualization(containerId);
        }, 100);
        
        return virtualizedHTML;
    }
    
    setupVirtualization(containerId) {
        const data = this._virtualizationData?.[containerId];
        if (!data) return;
        
        const container = document.querySelector(`[data-container-id="${containerId}"]`);
        if (!container) {
            // Retry after a short delay if container not found
            setTimeout(() => this.setupVirtualization(containerId), 200);
            return;
        }
        
        const spacerTop = container.querySelector('.virtualized-spacer-top');
        const content = container.querySelector('.virtualized-content');
        const spacerBottom = container.querySelector('.virtualized-spacer-bottom');
        
        if (!spacerTop || !content || !spacerBottom) return;
        
        const lines = data.lines;
        const lineHeight = 20; // Approximate line height in pixels
        const totalLines = lines.length;
        
        // Find the scrollable parent container
        let diffContent = container.closest('.diff-content');
        if (!diffContent) {
            // Try finding by ID
            diffContent = document.getElementById(containerId)?.parentElement;
        }
        
        if (!diffContent) {
            console.warn('Could not find scrollable container for virtualization');
            // Fallback: render all content
            content.textContent = lines.join('\n');
            return;
        }
        
        const containerHeight = diffContent.clientHeight || 600;
        const visibleLines = Math.ceil(containerHeight / lineHeight);
        
        const updateVisibleContent = () => {
            const scrollTop = diffContent.scrollTop || 0;
            const startLine = Math.max(0, Math.floor(scrollTop / lineHeight) - 100);
            const endLine = Math.min(totalLines, startLine + visibleLines + 200);
            
            const visibleLinesSlice = lines.slice(startLine, endLine);
            content.textContent = visibleLinesSlice.join('\n');
            
            // Update spacers
            spacerTop.style.height = `${startLine * lineHeight}px`;
            spacerBottom.style.height = `${(totalLines - endLine) * lineHeight}px`;
        };
        
        // Initial render
        updateVisibleContent();
        
        // Setup scroll listener on the diff-content container
        diffContent.addEventListener('scroll', updateVisibleContent);
        
        // Store cleanup function
        container._cleanup = () => {
            diffContent.removeEventListener('scroll', updateVisibleContent);
        };
    }
    
    formatStatsLine(stats, originalLineCount) {
        const cleanedLineCount = originalLineCount - (stats.linesRemoved || 0);
        const totalHeadersFooters = (stats.headerFooterRemoved || 0) + (stats.repeatingHeadersFootersRemoved || 0);
        const parts = [
            `Lines: ${originalLineCount} → ${cleanedLineCount}`,
            `Removed: ${stats.emptyLinesRemoved || 0} empty, ${totalHeadersFooters} headers/footers, ${stats.punctuationLinesRemoved || 0} punctuation`,
            `Collapsed: ${stats.duplicatesCollapsed || 0} duplicates`,
        ];
        
        if (stats.mergedLines) {
            parts.push(`${stats.mergedLines} merged`);
        }
        if (stats.dehyphenatedTokens) {
            parts.push(`${stats.dehyphenatedTokens} dehyphenated`);
        }
        
        return parts.join(' | ');
    }

    displayResults(results, totalStats) {
        let html = '';

        // Brief stats line
        const briefStats = [];
        if (totalStats.mergedLines > 0) briefStats.push(`Merged ${totalStats.mergedLines} lines`);
        if (totalStats.dehyphenatedTokens > 0) briefStats.push(`Dehyphenated ${totalStats.dehyphenatedTokens} tokens`);
        if (totalStats.repeatingHeadersFootersRemoved > 0) briefStats.push(`Removed ${totalStats.repeatingHeadersFootersRemoved} repeating headers/footers`);
        const briefStatsLine = briefStats.length > 0 ? briefStats.join(', ') : null;

        // Statistics summary
        html += `
            <div class="stats-summary">
                <h3>Summary Statistics</h3>
                ${briefStatsLine ? `<p class="brief-stats" style="margin: 0.5rem 0; color: var(--text-light); font-size: 0.9rem;">${briefStatsLine}</p>` : ''}
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.filesProcessed}</span>
                        <span class="stat-label">Files Processed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.linesRemoved}</span>
                        <span class="stat-label">Lines Removed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.duplicatesCollapsed}</span>
                        <span class="stat-label">Duplicates Collapsed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.emptyLinesRemoved}</span>
                        <span class="stat-label">Empty Lines Removed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.headerFooterRemoved + (totalStats.repeatingHeadersFootersRemoved || 0)}</span>
                        <span class="stat-label">Headers/Footers Removed</span>
                    </div>
                    ${totalStats.punctuationLinesRemoved > 0 ? `
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.punctuationLinesRemoved}</span>
                        <span class="stat-label">Punctuation Lines Removed</span>
                    </div>
                    ` : ''}
                    ${totalStats.dehyphenatedTokens > 0 ? `
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.dehyphenatedTokens}</span>
                        <span class="stat-label">Dehyphenated Tokens</span>
                    </div>
                    ` : ''}
                    ${totalStats.mergedLines > 0 ? `
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.mergedLines}</span>
                        <span class="stat-label">Lines Merged</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Individual file results with side-by-side preview
        results.forEach((result, index) => {
            if (!result.success) {
                html += `
                    <div class="result-card error">
                        <h4>${this.escapeHtml(result.fileName)}</h4>
                        <p class="error-message">Error: ${this.escapeHtml(result.error)}</p>
                    </div>
                `;
                return;
            }

            const originalLines = result.originalText.split('\n').length;
            const statsLine = this.formatStatsLine(result.stats, originalLines);
            const modeBadge = result.mode === 'smart' ? '<span class="mode-badge smart">🤖 Smart Clean</span>' : 
                             result.mode === 'fast-fallback' ? '<span class="mode-badge fallback">⚡ Fast (Fallback)</span>' : 
                             '<span class="mode-badge fast">⚡ Fast Clean</span>';
            
            const originalContainerId = `original-${index}`;
            const cleanedContainerId = `cleaned-${index}`;
            const originalNeedsVirtual = result.originalText.length > 1024 * 1024;
            const cleanedNeedsVirtual = result.cleanedText.length > 1024 * 1024;

            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h4>${this.escapeHtml(result.fileName)} ${modeBadge}</h4>
                    </div>
                    <div class="result-content">
                        <div class="diff-container">
                            <div class="diff-column original-column">
                                <div class="diff-header">
                                    <h5>Original</h5>
                                </div>
                                <div class="diff-content" id="${originalContainerId}">
                                    ${originalNeedsVirtual ? 
                                        this.createVirtualizedPreview(result.originalText, originalContainerId) :
                                        `<pre class="text-preview-content">${this.escapeHtml(result.originalText)}</pre>`
                                    }
                                </div>
                            </div>
                            <div class="diff-column cleaned-column">
                                <div class="diff-header">
                                    <h5>Cleaned</h5>
                                    <div class="diff-actions">
                                        <button class="btn btn-primary download-btn" data-index="${index}">
                                            📥 Download
                                        </button>
                                        <button class="btn btn-secondary copy-btn" data-index="${index}">
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                                <div class="diff-content" id="${cleanedContainerId}">
                                    ${cleanedNeedsVirtual ? 
                                        this.createVirtualizedPreview(result.cleanedText, cleanedContainerId) :
                                        `<pre class="text-preview-content">${this.escapeHtml(result.cleanedText)}</pre>`
                                    }
                                </div>
                            </div>
                        </div>
                        <div class="stats-line">
                            ${statsLine}
                        </div>
                    </div>
                </div>
            `;
        });

        this.resultsContainer.innerHTML = html;
        
        // Inject or update Download All container right AFTER the summary statistics
        let bulkContainer = document.getElementById('downloadAllContainer');
        if (!bulkContainer) {
            bulkContainer = document.createElement('div');
            bulkContainer.id = 'downloadAllContainer';
            bulkContainer.className = 'result-actions';
        }
        bulkContainer.innerHTML = '';
        
        const statsSummaryEl = this.resultsContainer.querySelector('.stats-summary');
        if (statsSummaryEl) {
            // Place after stats summary
            if (!bulkContainer.parentElement) {
                statsSummaryEl.insertAdjacentElement('afterend', bulkContainer);
            }
        } else if (!bulkContainer.parentElement && this.resultsContainer.parentElement) {
            // Fallback: append at top of results section
            this.resultsContainer.parentElement.insertBefore(bulkContainer, this.resultsContainer);
        }
        
        if (Array.isArray(results) && results.length > 0) {
            if (results.length > 1) {
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary';
                btn.id = 'downloadAllBtn';
                btn.textContent = `Download all (${results.length})`;
                bulkContainer.appendChild(btn);
                btn.addEventListener('click', () => this.downloadAll(results));
            }
            const clearBtn = document.createElement('button');
            clearBtn.className = 'btn btn-secondary';
            clearBtn.id = 'clearAllBtn';
            clearBtn.textContent = 'Clear list';
            bulkContainer.appendChild(clearBtn);
            clearBtn.addEventListener('click', () => this.clearAll());
        }

        // Setup download and copy buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index || e.target.closest('.download-btn').dataset.index);
                if (results[index]) {
                    this.downloadFile(results[index]);
                }
            });
        });

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index || e.target.closest('.copy-btn').dataset.index);
                if (results[index]) {
                    this.copyToClipboard(results[index].cleanedText);
                }
            });
        });
    }

    downloadFile(result) {
        try {
            const blob = new Blob([result.cleanedText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            // Get original filename and extension
            const originalName = result.fileName;
            const nameWithoutExt = originalName.replace(/\.(txt|docx)$/i, '');
            const downloadName = `${nameWithoutExt}_cleaned.txt`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // Trigger download
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            this.showToast(`Downloaded: ${downloadName}`);
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Failed to download file', 'error');
        }
    }

    async downloadAll(results) {
        if (!Array.isArray(results) || results.length < 2) return;
        try {
            const button = document.getElementById('downloadAllBtn');
            if (button) {
                button.disabled = true;
            }
            this.showToast('Creating ZIP…');
            const zip = new JSZip();
            results.forEach((r, i) => {
                const base = (r.fileName || `document_${i + 1}`).replace(/\.[^.]+$/, '');
                zip.file(`${base}_cleaned.txt`, r.cleanedText || '');
            });
            const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
                const percent = Math.round(metadata.percent || 0);
                if (percent % 10 === 0) {
                    this.showToast(`Creating ZIP… ${percent}%`);
                }
            });
            const name = `docstripper_${results.length}_files.zip`;
            saveAs(blob, name);
            this.showToast(`Downloaded: ${name}`);
        } catch (e) {
            console.error('ZIP error:', e);
            this.showToast('Failed to create ZIP', 'error');
        } finally {
            const button = document.getElementById('downloadAllBtn');
            if (button) {
                button.disabled = false;
            }
        }
    }

    clearAll() {
        try {
            this.files = [];
            this.results = [];
            if (this.fileInput) {
                this.fileInput.value = '';
            }
            if (this.fileList) {
                this.fileList.innerHTML = '';
            }
            this.updateStartButton();
            if (this.resultsSection) {
                this.resultsSection.style.display = 'none';
            }
            const uploadSection = document.querySelector('.upload-section');
            if (uploadSection) {
                uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            this.showToast('Cleared uploaded files and results');
        } catch (e) {
            console.error('Clear all error:', e);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show toast notification instead of alert
            this.showToast('Text copied to clipboard!');
        }).catch(() => {
            this.showToast('Failed to copy to clipboard', 'error');
        });
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Customize Google Translate widget
function customizeGoogleTranslate() {
    // Wait for Google Translate to load
    const checkTranslate = setInterval(() => {
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
            // Check for either link or select element
            const link = translateElement.querySelector('a.VIpgJd-ZVi9od-xl07Ob-lTBxed') || 
                       translateElement.querySelector('.goog-te-gadget-simple a');
            const select = translateElement.querySelector('select');
            
            if (link || select) {
                clearInterval(checkTranslate);
                applyTranslateStyles();
            }
        }
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkTranslate), 5000);
}

function applyTranslateStyles() {
    const translateElement = document.getElementById('google_translate_element');
    if (!translateElement) return;
    
    // Try to find link element (SIMPLE layout)
    const link = translateElement.querySelector('a.VIpgJd-ZVi9od-xl07Ob-lTBxed') || 
                 translateElement.querySelector('.goog-te-gadget-simple a');
    
    // Try to find select element (if using different layout)
    const select = translateElement.querySelector('select');
    
    if (link) {
        // Apply styles directly with !important using setProperty
        link.style.setProperty('background', 'rgba(255, 255, 255, 0.2)', 'important');
        link.style.setProperty('border', '2px solid rgba(255, 255, 255, 0.3)', 'important');
        link.style.setProperty('width', '50px', 'important');
        link.style.setProperty('height', '50px', 'important');
        link.style.setProperty('border-radius', '12px', 'important');
        link.style.setProperty('display', 'flex', 'important');
        link.style.setProperty('align-items', 'center', 'important');
        link.style.setProperty('justify-content', 'center', 'important');
        link.style.setProperty('padding', '0', 'important');
        link.style.setProperty('margin', '0', 'important');
        link.style.setProperty('color', 'transparent', 'important');
        link.style.setProperty('font-size', '0', 'important');
        link.style.setProperty('text-decoration', 'none', 'important');
        link.style.setProperty('box-sizing', 'border-box', 'important');
        link.style.setProperty('cursor', 'pointer', 'important');
        link.style.setProperty('transition', 'all 0.3s ease', 'important');
        link.style.setProperty('backdrop-filter', 'blur(10px)', 'important');
        
        // Hide all children inside the link
        Array.from(link.children).forEach(child => {
            child.style.setProperty('display', 'none', 'important');
            child.style.setProperty('visibility', 'hidden', 'important');
            child.style.setProperty('opacity', '0', 'important');
        });
        
        // Hide all images
        const images = link.querySelectorAll('img');
        images.forEach(img => {
            img.style.setProperty('display', 'none', 'important');
            img.style.setProperty('visibility', 'hidden', 'important');
            img.style.setProperty('opacity', '0', 'important');
        });
        
        // Hide text content
        link.textContent = '';
        
        // Add hover effect
        link.addEventListener('mouseenter', () => {
            link.style.setProperty('background-color', 'rgba(255, 255, 255, 0.3)', 'important');
            link.style.setProperty('transform', 'scale(1.05)', 'important');
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.setProperty('background-color', 'rgba(255, 255, 255, 0.2)', 'important');
            link.style.setProperty('transform', 'scale(1)', 'important');
        });
    }
    
    if (select) {
        // Apply styles to select
        select.style.setProperty('background', 'rgba(255, 255, 255, 0.2)', 'important');
        select.style.setProperty('border', '2px solid rgba(255, 255, 255, 0.3)', 'important');
        select.style.setProperty('color', 'transparent', 'important');
        select.style.setProperty('width', '50px', 'important');
        select.style.setProperty('height', '50px', 'important');
        select.style.setProperty('border-radius', '12px', 'important');
        select.style.setProperty('font-size', '0', 'important');
        select.style.setProperty('cursor', 'pointer', 'important');
        select.style.setProperty('transition', 'all 0.3s ease', 'important');
        select.style.setProperty('backdrop-filter', 'blur(10px)', 'important');
        select.style.setProperty('outline', 'none', 'important');
        select.style.setProperty('-webkit-appearance', 'none', 'important');
        select.style.setProperty('-moz-appearance', 'none', 'important');
        select.style.setProperty('appearance', 'none', 'important');
        select.style.setProperty('padding', '0', 'important');
        select.style.setProperty('margin', '0', 'important');
        select.style.setProperty('display', 'flex', 'important');
        select.style.setProperty('align-items', 'center', 'important');
        select.style.setProperty('justify-content', 'center', 'important');
        select.style.setProperty('position', 'relative', 'important');
        select.style.setProperty('background-image', 'none', 'important');
    }
    
    // Hide Google Translate icon
    const icon = translateElement.querySelector('.goog-te-gadget-icon');
    if (icon) {
        icon.style.setProperty('display', 'none', 'important');
    }
}

// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        if (!this.themeToggle) {
            console.error('Theme toggle button not found');
            return;
        }
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateIcon();
        this.themeToggle.addEventListener('click', () => this.toggle());
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateIcon();
        // Reapply Google Translate styles when theme changes
        setTimeout(() => applyTranslateStyles(), 100);
    }

    updateIcon() {
        const icon = this.themeToggle.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }
}

// Load JSZip library dynamically
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (window.JSZip) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize app when DOM is ready
async function init() {
    try {
        // Initialize theme manager first
        new ThemeManager();
        
        // Customize Google Translate widget after it loads
        customizeGoogleTranslate();
        
        // Load JSZip and initialize app
        await loadJSZip();
        window.JSZip = JSZip;
        window.app = new App(); // Save app instance for testing
        
        // Update copyright year automatically
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
        // Support button functionality
        const supportBtn = document.getElementById('supportBtn');
        const supportMenu = document.getElementById('supportMenu');
        const supportClose = document.getElementById('supportClose');
        
        if (supportBtn && supportMenu) {
            // Toggle menu on button click
            supportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                supportMenu.classList.toggle('show');
            });
            
            // Close menu on close button click
            if (supportClose) {
                supportClose.addEventListener('click', (e) => {
                    e.stopPropagation();
                    supportMenu.classList.remove('show');
                });
            }
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!supportBtn.contains(e.target) && !supportMenu.contains(e.target)) {
                    supportMenu.classList.remove('show');
                }
            });
            
            // Close menu on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && supportMenu.classList.contains('show')) {
                    supportMenu.classList.remove('show');
                }
            });
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-banner';
        errorDiv.innerHTML = 'Failed to initialize app. Please refresh the page.';
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
