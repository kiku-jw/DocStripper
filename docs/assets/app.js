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
        };
        
        // Enhanced header/footer patterns
        this.headerPatterns = [
            /^Page\s+\d+\s+of\s+\d+$/i,
            /^\d+\s+of\s+\d+$/i,
            /^Page\s+\d+$/i,
            /^Página\s+\d+\s+de\s+\d+$/i, // Spanish
            /^Страница\s+\d+\s+из\s+\d+$/i, // Russian
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
        
        // Lines with only punctuation characters: ---, ***, ===, etc.
        return /^[^\w\s]+$/.test(stripped) && stripped.length <= 50;
    }

    isHeaderFooter(line) {
        const stripped = line.trim();
        return this.headerPatterns.some(pattern => pattern.test(stripped));
    }

    cleanText(text) {
        if (!text) return { text: '', stats: this.getEmptyStats() };

        const lines = text.split('\n');
        const cleanedLines = [];
        let prevLine = null;
        let prevNonEmptyLine = null;
        const stats = {
            linesRemoved: 0,
            duplicatesCollapsed: 0,
            emptyLinesRemoved: 0,
            headerFooterRemoved: 0,
            punctuationLinesRemoved: 0,
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

            // Skip page numbers (if enabled)
            if (this.options.removePageNumbers && this.isPageNumber(stripped)) {
                stats.headerFooterRemoved++;
                continue;
            }

            // Skip headers/footers (if enabled)
            if (this.options.removeHeadersFooters && this.isHeaderFooter(stripped)) {
                stats.headerFooterRemoved++;
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

        stats.linesRemoved = lines.length - cleanedLines.length;
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

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            
            if (file.name.endsWith('.txt')) {
                reader.readAsText(file, 'UTF-8');
            } else if (file.name.endsWith('.docx')) {
                this.extractTextFromDocx(file).then(resolve).catch(reject);
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

            const cleanedText = result.join('\n');
            const cleanedLineCount = cleanedText.split('\n').length;
            stats.linesRemoved = originalLineCount - cleanedLineCount;

            // Validate result is not empty
            if (!cleanedText.trim() && text.trim()) {
                console.warn('Smart clean produced empty result, using original text');
                return { text: text, stats: this.getEmptyStats() };
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
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        
        // Start button
        this.startBtn = document.getElementById('startBtn');
        
        // Mode selection
        this.fastMode = document.getElementById('fastMode');
        this.smartMode = document.getElementById('smartMode');
        this.smartModeWarning = document.getElementById('smartModeWarning');
        this.smartProgress = document.getElementById('smartProgress');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.modeNote = document.getElementById('modeNote');
        
        // Settings checkboxes
        this.removeEmptyLines = document.getElementById('removeEmptyLines');
        this.removePageNumbers = document.getElementById('removePageNumbers');
        this.removeHeadersFooters = document.getElementById('removeHeadersFooters');
        this.removeDuplicates = document.getElementById('removeDuplicates');
        this.removePunctuationLines = document.getElementById('removePunctuationLines');
        this.preserveParagraphSpacing = document.getElementById('preserveParagraphSpacing');
        
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
        
        // Settings change - update start button state (don't reprocess automatically)
        if (this.removeEmptyLines) {
            this.removeEmptyLines.addEventListener('change', () => {
                // Settings changed - don't auto-process, just update button state
                this.updateStartButton();
            });
        }
        if (this.removePageNumbers) {
            this.removePageNumbers.addEventListener('change', () => {
                this.updateStartButton();
            });
        }
        if (this.removeHeadersFooters) {
            this.removeHeadersFooters.addEventListener('change', () => {
                this.updateStartButton();
            });
        }
        if (this.removeDuplicates) {
            this.removeDuplicates.addEventListener('change', () => {
                this.updateStartButton();
            });
        }
        if (this.removePunctuationLines) {
            this.removePunctuationLines.addEventListener('change', () => {
                this.updateStartButton();
            });
        }
        if (this.preserveParagraphSpacing) {
            this.preserveParagraphSpacing.addEventListener('change', () => {
                this.updateStartButton();
            });
        }
        
        // Mode selection handlers
        if (this.fastMode) {
            this.fastMode.addEventListener('change', () => {
                if (this.fastMode.checked) {
                    this.cleaningMode = 'fast';
                    this.updateModeUI();
                }
            });
        }
        if (this.smartMode) {
            this.smartMode.addEventListener('change', () => {
                if (this.smartMode.checked) {
                    this.cleaningMode = 'smart';
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
            file.name.endsWith('.txt') || file.name.endsWith('.docx')
        );

        if (validFiles.length === 0) {
            this.showToast('Please upload .txt or .docx files only.', 'error');
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
        
        // Scroll to settings section to show uploaded files
        setTimeout(() => {
            const settingsSection = document.getElementById('settingsSection');
            if (settingsSection) {
                settingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
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
            removeDuplicates: this.removeDuplicates ? this.removeDuplicates.checked : true,
            removePunctuationLines: this.removePunctuationLines ? this.removePunctuationLines.checked : true,
            preserveParagraphSpacing: this.preserveParagraphSpacing ? this.preserveParagraphSpacing.checked : true,
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
                    totalStats.linesRemoved += result.stats.linesRemoved;
                    totalStats.duplicatesCollapsed += result.stats.duplicatesCollapsed || 0;
                    totalStats.emptyLinesRemoved += result.stats.emptyLinesRemoved || 0;
                    totalStats.headerFooterRemoved += result.stats.headerFooterRemoved || 0;
                    totalStats.punctuationLinesRemoved += result.stats.punctuationLinesRemoved || 0;
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
        
        // Scroll to results section after processing
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    displayResults(results, totalStats) {
        let html = '';

        // Statistics summary
        html += `
            <div class="stats-summary">
                <h3>Summary Statistics</h3>
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
                        <span class="stat-value">${totalStats.headerFooterRemoved}</span>
                        <span class="stat-label">Headers/Footers Removed</span>
                    </div>
                    ${totalStats.punctuationLinesRemoved > 0 ? `
                    <div class="stat-item">
                        <span class="stat-value">${totalStats.punctuationLinesRemoved}</span>
                        <span class="stat-label">Punctuation Lines Removed</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Individual file results
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

            const displayText = result.cleanedText;
            const modeBadge = result.mode === 'smart' ? '<span class="mode-badge smart">🤖 Smart Clean</span>' : 
                             result.mode === 'fast-fallback' ? '<span class="mode-badge fallback">⚡ Fast (Fallback)</span>' : 
                             '<span class="mode-badge fast">⚡ Fast Clean</span>';

            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h4>${this.escapeHtml(result.fileName)} ${modeBadge}</h4>
                        <div class="result-stats">
                            <span>${result.stats.linesRemoved} lines removed</span>
                            ${result.stats.duplicatesCollapsed > 0 ? `<span>${result.stats.duplicatesCollapsed} duplicates</span>` : ''}
                            ${result.stats.headerFooterRemoved > 0 ? `<span>${result.stats.headerFooterRemoved} headers/footers</span>` : ''}
                            ${result.stats.punctuationLinesRemoved > 0 ? `<span>${result.stats.punctuationLinesRemoved} punctuation</span>` : ''}
                        </div>
                    </div>
                    <div class="result-content">
                        <div class="text-preview">
                            <pre>${this.escapeHtml(displayText)}</pre>
                        </div>
                        <div class="result-actions">
                            <button class="btn btn-primary download-btn" data-index="${index}">
                                📥 Download Cleaned File
                            </button>
                            <button class="btn btn-secondary copy-btn" data-index="${index}">
                                📋 Copy to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        this.resultsContainer.innerHTML = html;

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
        
        // Load JSZip and initialize app
        await loadJSZip();
        window.JSZip = JSZip;
        window.app = new App(); // Save app instance for testing
        
        // Update copyright year automatically
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
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
