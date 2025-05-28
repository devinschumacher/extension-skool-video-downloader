# Skool Video Downloader Extension

A Chrome extension that adds a download button to Skool classroom pages for easy Loom video extraction.

## Installation

1. Download this folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `skool-loom-extension` folder

## How to Use

1. Navigate to any Skool lesson page (with `?md=` in URL)
2. Click the blue "Download Video" button that appears
3. A modal will show with:
   - Video URL to copy
   - Download button for URL file
   - Links to subscribe/follow for more tools

## Customization

Edit these files to customize:
- `content.js` - Change YouTube video ID, email signup URL, social links
- `styles.css` - Modify colors, fonts, layout
- `manifest.json` - Update extension name, description

## Creating Icons

For proper icons, create PNG images:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

## Features

- One-click video URL extraction
- Shows video title and duration
- Modal with CTAs (YouTube, email signup, social links)
- Clean, professional design
- No external dependencies