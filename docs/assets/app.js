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
        this.dryRunCheck = document.getElementById('dryRunCheck');
        this.clearBtn = document.getElementById('clearBtn');
    }

    setupEventListeners() {
        // Click to upload
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
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

        // Clear button
        this.clearBtn.addEventListener('click', () => {
            this.clearAll();
        });
    }

    handleFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.name.endsWith('.txt') || file.name.endsWith('.docx')
        );

        if (validFiles.length === 0) {
            alert('Please upload .txt or .docx files only.');
            return;
        }

        this.files.push(...validFiles);
        this.updateFileList();
        this.processFiles();
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
            this.clearBtn.style.display = 'none';
            return;
        }

        this.clearBtn.style.display = 'inline-block';
        this.fileList.innerHTML = '<h3>Uploaded Files:</h3>';
        
        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
                <button class="remove-file" data-index="${index}">×</button>
            `;
            
            fileItem.querySelector('.remove-file').addEventListener('click', () => {
                this.files.splice(index, 1);
                this.updateFileList();
                if (this.files.length === 0) {
                    this.clearAll();
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
                        <h4>${result.fileName}</h4>
                        <p class="error-message">Error: ${result.error}</p>
                    </div>
                `;
                return;
            }

            const isDryRun = this.dryRunCheck.checked;
            const displayText = isDryRun ? result.cleanedText : result.cleanedText;

            html += `
                <div class="result-card">
                    <div class="result-header">
                        <h4>${result.fileName}</h4>
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
                const index = parseInt(e.target.dataset.index);
                this.downloadFile(results[index]);
            });
        });

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.copyToClipboard(results[index].cleanedText);
            });
        });
    }

    downloadFile(result) {
        const blob = new Blob([result.cleanedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName.replace(/\.(txt|docx)$/, '_cleaned.txt');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Text copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy to clipboard');
        });
    }

    clearAll() {
        this.files = [];
        this.results = [];
        this.fileInput.value = '';
        this.updateFileList();
        this.resultsSection.style.display = 'none';
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

// Load JSZip library dynamically
function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
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
        icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
}

// Initialize app when DOM is ready
async function init() {
    try {
        // Initialize theme manager first
        new ThemeManager();
        
        // Load JSZip and initialize app
        await loadJSZip();
        window.JSZip = JSZip;
        new App();
    } catch (error) {
        console.error('Failed to load JSZip:', error);
        alert('Failed to initialize app. Please refresh the page.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

