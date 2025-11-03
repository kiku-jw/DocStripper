# Support & Social Links Templates

This directory contains templates for adding support/funding links and social media links to your projects.

## 📁 Files

- **`FUNDING.yml.template`** - GitHub funding configuration template
- **`README_SUPPORT_SECTION.md.template`** - README support and social links section
- **`support-button.html.template`** - HTML template for floating support button (for websites)
- **`support-button.css.template`** - CSS styles for floating support button

## 🚀 Quick Start

### 1. GitHub Funding Button

Copy `FUNDING.yml.template` to `.github/FUNDING.yml` in your project and replace placeholders:

```bash
cp TEMPLATE_FILES/support/FUNDING.yml.template .github/FUNDING.yml
```

Then edit `.github/FUNDING.yml` and replace:
- `YOUR_USERNAME` → Your actual usernames
- `YOUR_GITHUB_USERNAME` → Your GitHub username
- `YOUR_DISCORD_INVITE` → Your Discord invite code

### 2. README Support Section

Add the content from `README_SUPPORT_SECTION.md.template` to your `README.md`:

```bash
cat TEMPLATE_FILES/support/README_SUPPORT_SECTION.md.template >> README.md
```

Then edit `README.md` and replace all placeholders with your actual links.

### 3. Website Support Button (Optional)

For web projects, add a floating support button:

1. Copy HTML from `support-button.html.template` to your `index.html` (before `</body>`)
2. Copy CSS from `support-button.css.template` to your stylesheet
3. Replace `PROJECT_NAME` and all URLs with your actual values

## 📝 Placeholders to Replace

| Placeholder | Description | Example |
|------------|-------------|---------|
| `YOUR_USERNAME` | Your username on the platform | `kiku` |
| `YOUR_GITHUB_USERNAME` | Your GitHub username | `kiku-jw` |
| `YOUR_DISCORD_INVITE` | Discord invite code | `4Kxs97JvsU` |
| `YOUR_CHANNEL` | Telegram channel username | `kiku_blog` |
| `YOUR_PROFILE` | LinkedIn profile username | `kiku-jw` |
| `PROJECT_NAME` | Your project name | `DocStripper` |

## 💡 Tips

- **GitHub Funding**: The funding button appears automatically on your repository page when `FUNDING.yml` is configured
- **Custom Links**: You can add custom links in the `custom` array in `FUNDING.yml`
- **Privacy**: Consider which social links you want to share publicly
- **Consistency**: Use the same usernames across platforms for better branding

## 🎨 Customization

- **Colors**: Adjust CSS variables (`--primary-color`, `--background`, etc.) to match your theme
- **Position**: Change `bottom` and `right` values in `.support-container` to reposition the button
- **Icons**: Replace emoji icons with Font Awesome or other icon libraries if desired
- **Layout**: Modify the menu structure to add/remove links as needed

## 📚 Resources

- [GitHub Sponsors](https://github.com/sponsors)
- [Buy Me a Coffee](https://www.buymeacoffee.com/)
- [Ko-fi](https://ko-fi.com/)
- [Thanks.dev](https://thanks.dev/)



