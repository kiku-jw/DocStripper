# Website Support Button Template

Complete HTML/CSS template for a floating support button with menu (as used in DocStripper).

## HTML Structure

```html
<!-- Support Button -->
<div class="support-container">
    <button class="support-btn" id="supportBtn" aria-label="Support this project" title="Support this project">
        💝
    </button>
    <div class="support-menu" id="supportMenu">
        <div class="support-menu-header">
            <strong>Support PROJECT_NAME</strong>
            <button class="support-close" id="supportClose" aria-label="Close">×</button>
        </div>
        <div class="support-menu-links">
            <a href="https://buymeacoffee.com/YOUR_BMAC_USERNAME" target="_blank" rel="noopener noreferrer" class="support-link">
                <span>☕</span> Buy Me a Coffee
            </a>
            <a href="https://thanks.dev/YOUR_THANKS_DEV_ID" target="_blank" rel="noopener noreferrer" class="support-link">
                <span>🙏</span> Thanks.dev
            </a>
            <a href="https://ko-fi.com/YOUR_KO_FI_USERNAME" target="_blank" rel="noopener noreferrer" class="support-link">
                <span>💚</span> Ko-fi
            </a>
        </div>
        <div class="support-menu-social">
            <a href="https://discord.gg/YOUR_DISCORD_INVITE" target="_blank" rel="noopener noreferrer" class="support-social" title="Discord">
                💬
            </a>
            <a href="https://t.me/YOUR_TELEGRAM" target="_blank" rel="noopener noreferrer" class="support-social" title="Telegram">
                📰
            </a>
            <a href="https://www.linkedin.com/in/YOUR_LINKEDIN/" target="_blank" rel="noopener noreferrer" class="support-social" title="LinkedIn">
                💼
            </a>
            <a href="https://about.me/YOUR_ABOUTME" target="_blank" rel="noopener noreferrer" class="support-social" title="About.me">
                🌐
            </a>
        </div>
    </div>
</div>
```

## CSS Styles

```css
/* Support Button */
.support-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 999;
}

.support-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.support-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

.support-btn:active {
    transform: scale(0.95);
}

.support-menu {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 8px 32px var(--shadow-lg);
    padding: 1rem;
    min-width: 240px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: all 0.3s ease;
    z-index: 1000;
}

.support-menu.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.support-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
}

.support-menu-header strong {
    color: var(--text);
    font-size: 1rem;
}

.support-close {
    background: none;
    border: none;
    color: var(--text-light);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: color 0.2s ease;
}

.support-close:hover {
    color: var(--text);
}

.support-menu-links {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.support-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    color: var(--text);
    text-decoration: none;
    border-radius: 8px;
    transition: background-color 0.2s ease;
    font-size: 0.9rem;
}

.support-link:hover {
    background: var(--surface);
}

.support-link span {
    font-size: 1.2rem;
}

.support-menu-social {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
}

.support-social {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
    font-size: 1.2rem;
    transition: all 0.2s ease;
}

.support-social:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-2px);
}

@media (max-width: 480px) {
    .support-container {
        bottom: 1rem;
        right: 1rem;
    }
    
    .support-btn {
        width: 48px;
        height: 48px;
        font-size: 1.25rem;
    }
    
    .support-menu {
        bottom: 60px;
        right: 0;
        left: auto;
        min-width: 200px;
    }
}
```

## JavaScript Functionality

```javascript
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
```

## CSS Variables Required

Make sure your CSS includes these variables (or replace with actual colors):

```css
:root {
    --background: #ffffff;
    --border: #e1e4e8;
    --text: #24292e;
    --text-light: #6a737d;
    --surface: #f6f8fa;
    --primary-color: #0366d6;
    --shadow-lg: rgba(0, 0, 0, 0.1);
}
```

## Customization

1. **Change button emoji**: Replace `💝` with your preferred emoji
2. **Adjust colors**: Modify the gradient in `.support-btn`
3. **Change position**: Adjust `bottom` and `right` values in `.support-container`
4. **Add/remove links**: Modify the HTML structure as needed
5. **Customize animations**: Adjust transition timings and effects

