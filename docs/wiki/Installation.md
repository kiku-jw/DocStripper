# Installation Guide

## Web Application

DocStripper web application requires no installation! Just visit:
**https://kiku-jw.github.io/DocStripper/**

### Browser Requirements

- Modern browser with JavaScript enabled
- For Smart Clean mode: WebGPU support (most modern browsers)
  - Chrome/Edge 113+
  - Firefox 110+
  - Safari 18+

## CLI Tool

### Prerequisites

- Python 3.9 or higher
- (Optional) For PDF support: `pdftotext` from poppler-utils

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kiku-jw/DocStripper.git
   cd DocStripper
   ```

2. **Install PDF support (optional):**
   
   **macOS:**
   ```bash
   brew install poppler
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt-get install poppler-utils
   ```
   
   **Windows:**
   Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)

3. **Verify installation:**
   ```bash
   python tool.py --help
   ```

### Verify Python Version

```bash
python --version  # Should be 3.9 or higher
```

## Troubleshooting

### Web App Issues

- **Smart Clean not working?** Check if your browser supports WebGPU
- **Model not loading?** Ensure you have a stable internet connection for the first-time download

### CLI Issues

- **"pdftotext not found"** → Install poppler-utils (see above)
- **Permission denied** → Make sure Python is in your PATH
- **Import errors** → Ensure you're using Python 3.9+

## Next Steps

- Read the [Usage Guide](Usage)
- Check out [Examples](Examples)
- Explore [API Documentation](API)
