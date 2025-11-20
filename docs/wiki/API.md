# API Documentation

## Web Application API

### DocStripper Class

Main class for rule-based document cleaning.

```javascript
const stripper = new DocStripper(options);
```

#### Options

```javascript
{
  removeEmptyLines: boolean,        // Default: true
  removePageNumbers: boolean,        // Default: true
  removeHeadersFooters: boolean,    // Default: true
  removeDuplicates: boolean,         // Default: true
  removePunctuationLines: boolean,  // Default: true
  preserveParagraphSpacing: boolean  // Default: true
}
```

#### Methods

##### `processFile(file: File): Promise<Object>`

Processes a file and returns cleaned content with statistics.

**Parameters:**
- `file`: File object (from file input)

**Returns:**
```javascript
{
  fileName: string,
  content: string,
  stats: {
    originalLines: number,
    cleanedLines: number,
    removedLines: number,
    duplicatesRemoved: number,
    headersFootersRemoved: number,
    pageNumbersRemoved: number,
    punctuationLinesRemoved: number,
    emptyLinesRemoved: number
  }
}
```

### SmartCleaner Class

AI-powered document cleaning using WebLLM.

```javascript
const cleaner = new SmartCleaner();
```

#### Methods

##### `setSettings(settings: Object): void`

Update cleaning settings for the AI model.

##### `setProgressCallback(callback: Function): void`

Set callback for progress updates.

##### `cleanText(text: string, settings: Object): Promise<string>`

Clean text using AI model.

**Parameters:**
- `text`: String to clean
- `settings`: Cleaning options (same as DocStripper options)

**Returns:** Promise resolving to cleaned text string

##### `cancel(): void`

Cancel ongoing cleaning operation.

## CLI API

### Command Line Interface

```bash
python tool.py [OPTIONS] [FILES...]
```

### Python API

```python
from tool import DocStripper

stripper = DocStripper(
    remove_empty_lines=True,
    remove_page_numbers=True,
    remove_headers_footers=True,
    remove_duplicates=True,
    remove_punctuation_lines=True,
    preserve_paragraph_spacing=True
)

# Process text
cleaned_text, stats = stripper.process_text(text)

# Process file
cleaned_text, stats = stripper.process_file(file_path)
```

#### DocStripper Class

```python
class DocStripper:
    def __init__(self, **options):
        """
        Initialize DocStripper with cleaning options.
        
        Options:
            remove_empty_lines: bool
            remove_page_numbers: bool
            remove_headers_footers: bool
            remove_duplicates: bool
            remove_punctuation_lines: bool
            preserve_paragraph_spacing: bool
        """
    
    def process_text(self, text: str) -> tuple[str, dict]:
        """
        Process text string.
        
        Returns:
            tuple: (cleaned_text, statistics)
        """
    
    def process_file(self, file_path: str) -> tuple[str, dict]:
        """
        Process file from disk.
        
        Returns:
            tuple: (cleaned_text, statistics)
        """
```

## Integration Examples

### JavaScript

```javascript
// Rule-based cleaning
const file = document.getElementById('fileInput').files[0];
const stripper = new DocStripper({
  removeEmptyLines: true,
  removePageNumbers: true
});

const result = await stripper.processFile(file);
console.log(result.stats);
```

### Python

```python
from tool import DocStripper

stripper = DocStripper(
    remove_empty_lines=True,
    remove_page_numbers=True
)

cleaned, stats = stripper.process_file('document.txt')
print(f"Removed {stats['removed_lines']} lines")
```

## Error Handling

### Web Application

```javascript
try {
  const result = await stripper.processFile(file);
} catch (error) {
  console.error('Processing failed:', error);
  // Handle error
}
```

### CLI

```python
try:
    cleaned, stats = stripper.process_file(file_path)
except FileNotFoundError:
    print(f"File not found: {file_path}")
except Exception as e:
    print(f"Error: {e}")
```

## Performance Considerations

- **Fast Clean**: O(n) where n is number of lines
- **Smart Clean**: O(n) with overhead from LLM processing
- **Large files**: Consider chunking for Smart Clean mode
