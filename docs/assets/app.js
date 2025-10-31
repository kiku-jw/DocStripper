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

// UI Management
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
        this.files = [];
        this.results = [];
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

        // Get current settings from checkboxes
        const settings = {
            removeEmptyLines: this.removeEmptyLines ? this.removeEmptyLines.checked : true,
            removePageNumbers: this.removePageNumbers ? this.removePageNumbers.checked : true,
            removeHeadersFooters: this.removeHeadersFooters ? this.removeHeadersFooters.checked : true,
            removeDuplicates: this.removeDuplicates ? this.removeDuplicates.checked : true,
            removePunctuationLines: this.removePunctuationLines ? this.removePunctuationLines.checked : true,
            preserveParagraphSpacing: this.preserveParagraphSpacing ? this.preserveParagraphSpacing.checked : true,
        };

        // Create new stripper instance with current settings
        this.stripper = new DocStripper(settings);

        this.resultsSection.style.display = 'block';
        this.resultsContainer.innerHTML = '<div class="loading">Processing files...</div>';
        
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

        for (const file of this.files) {
            const result = await this.stripper.processFile(file);
            results.push(result);
            
            if (result.success) {
                totalStats.filesProcessed++;
                totalStats.linesRemoved += result.stats.linesRemoved;
                totalStats.duplicatesCollapsed += result.stats.duplicatesCollapsed;
                totalStats.emptyLinesRemoved += result.stats.emptyLinesRemoved;
                totalStats.headerFooterRemoved += result.stats.headerFooterRemoved;
                totalStats.punctuationLinesRemoved += result.stats.punctuationLinesRemoved || 0;
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

            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h4>${this.escapeHtml(result.fileName)}</h4>
                        <div class="result-stats">
                            <span>${result.stats.linesRemoved} lines removed</span>
                            <span>${result.stats.duplicatesCollapsed} duplicates</span>
                            <span>${result.stats.headerFooterRemoved} headers/footers</span>
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
