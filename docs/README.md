# GitHub Pages Setup

This directory contains the website for DocStripper hosted on GitHub Pages.

## 🚀 Setup Instructions

1. Go to your repository settings on GitHub: https://github.com/kiku-jw/DocStripper2/settings
2. Navigate to **"Pages"** in the left sidebar
3. Under **"Source"**, select **"Deploy from a branch"**
4. Choose:
   - Branch: `main`
   - Folder: `/docs`
5. Click **"Save"**

Your site will be available at: `https://kiku-jw.github.io/DocStripper2/`

## 📁 File Structure

```
docs/
├── index.html          # Main website page
└── assets/
    └── style.css      # Stylesheet
```

## 🎨 Customization

- Edit `index.html` to customize the website content
- Edit `assets/style.css` to change the styling
- All colors and styles are defined in CSS variables for easy customization

## 🧪 Local Testing

To test the website locally:

```bash
cd docs
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## 📝 Notes

- GitHub Pages automatically builds and deploys from the `/docs` folder
- Changes pushed to `main` branch will automatically update the site
- It may take a few minutes for changes to appear after pushing

