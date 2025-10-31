// DocStripper Web App - JavaScript Implementation

class DocStripper {
    constructor() {
        this.headerPatterns = [
            /^Page\s+\d+\s+of\s+\d+$/i,
            /^\d+\s+of\s+\d+$/i,
            /^Page\s+\d+$/i,
            /^Confidential$/i,
            /^DRAFT$/i,
            /^CONFIDENTIAL$/i,
            /^Draft$/i,
        ];
    }

    isPageNumber(line) {
        const stripped = line.trim();
        if (!stripped) return false;
        return /^\s*\d+\s*$/.test(stripped);
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
        const stats = {
            linesRemoved: 0,
            duplicatesCollapsed: 0,
            emptyLinesRemoved: 0,
            headerFooterRemoved: 0,
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.trim();

            // Skip empty or whitespace-only lines
            if (!stripped) {
                stats.emptyLinesRemoved++;
                continue;
            }

            // Skip page numbers
            if (this.isPageNumber(stripped)) {
                stats.headerFooterRemoved++;
                continue;
            }

            // Skip headers/footers
            if (this.isHeaderFooter(stripped)) {
                stats.headerFooterRemoved++;
                continue;
            }

            // Skip consecutive duplicates
            if (prevLine !== null && stripped === prevLine.trim()) {
                stats.duplicatesCollapsed++;
                continue;
            }

            cleanedLines.push(line);
            prevLine = line;
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
        };
    }
}

// UI Management
class App {
    constructor() {
        this.stripper = new DocStripper();
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
        
        // Check if elements exist
        if (!this.uploadArea || !this.fileInput) {
            console.error('Required elements not found');
            return;
        }
    }

    setupEventListeners() {
        // File input is positioned absolutely over upload area, so clicking anywhere opens it
        // Also handle direct clicks on upload area as fallback
        this.uploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on remove button or other interactive elements
            if (e.target.closest('.remove-file') || e.target.closest('.btn')) {
                return;
            }
            // If click is not on file input itself, trigger it
            if (this.fileInput && e.target !== this.fileInput && !e.target.closest('input[type="file"]')) {
                // Use setTimeout for better compatibility
                setTimeout(() => {
                    try {
                        this.fileInput.click();
                    } catch (err) {
                        console.error('Error opening file dialog:', err);
                    }
                }, 10);
            }
        });
        
        // Also handle mousedown for better compatibility
        this.uploadArea.addEventListener('mousedown', (e) => {
            if (e.target.closest('.remove-file') || e.target.closest('.btn')) {
                return;
            }
            if (this.fileInput && e.target !== this.fileInput && !e.target.closest('input[type="file"]')) {
                // Prevent default to avoid conflicts
                e.preventDefault();
                setTimeout(() => {
                    try {
                        this.fileInput.click();
                    } catch (err) {
                        console.error('Error opening file dialog:', err);
                    }
                }, 10);
            }
        });

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
        this.processFiles();
        
        // Reset file input to allow selecting the same file again
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
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
                } else {
                    this.processFiles();
                }
            });
            
            this.fileList.appendChild(fileItem);
        });
    }

    async processFiles() {
        if (this.files.length === 0) {
            this.resultsSection.style.display = 'none';
            return;
        }

        this.resultsSection.style.display = 'block';
        this.resultsContainer.innerHTML = '<div class="loading">Processing files...</div>';

        const results = [];
        let totalStats = {
            filesProcessed: 0,
            linesRemoved: 0,
            duplicatesCollapsed: 0,
            emptyLinesRemoved: 0,
            headerFooterRemoved: 0,
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
