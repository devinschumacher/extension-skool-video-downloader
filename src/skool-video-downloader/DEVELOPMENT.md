# Development Guide

## Project Structure

The extension is now modularized for better maintainability:

```
skool-video-downloader/
├── js/                      # Modular JavaScript files
│   ├── utils.js            # Utility functions (148 lines)
│   ├── videoDetection.js   # DOM-based video detection (103 lines)
│   ├── classroomVideo.js   # Skool classroom video extraction (107 lines)
│   ├── modal.js            # Modal UI functionality (127 lines)
│   └── content-main.js     # Main content script logic (103 lines)
├── popup.js                # Popup functionality
├── background.js           # Background service worker
└── manifest.json           # Extension manifest
```

**Total: 588 lines across 5 content script files** (down from 885 lines in a single file)

## Development Workflow

1. **Edit source files**: Make changes to files in the `js/` directory
2. **Test**: Chrome automatically loads the files in order as specified in manifest.json
3. **No build step needed**: The manifest loads files in the correct order

## Module Overview

### utils.js (148 lines)
- `isElementVisible()` - Check if element is visible on page
- `extractVideoId()` - Extract video ID from URLs
- `detectPlatform()` - Detect video platform from URL
- `normalizeVideoUrl()` - Clean and normalize video URLs
- `getDownloadCommand()` - Generate platform-specific download commands
- `findNearestTitle()` - Find title element near video

### videoDetection.js (103 lines)
- `extractVideoFromIframe()` - Extract video info from iframe elements
- `findVisibleVideosOnly()` - Find only visible videos on current page

### classroomVideo.js (107 lines)
- `extractClassroomVideo()` - Extract video from Skool classroom data
- `findCourseById()` - Recursive search for course data
- `searchPageDataForVideos()` - Search page data for video URLs

### modal.js (127 lines)
- `showModal()` - Display main modal with video info
- `showMultipleVideosModal()` - Display modal for multiple videos
- Modal HTML generation and event handling

### content-main.js (103 lines)
- Main content script that uses the modular functions
- Message listener for popup communication
- `extractVideoForPopup()` - Main function called by popup

## Loading Order

The manifest.json loads scripts in this order:
1. `utils.js` - Base utility functions
2. `videoDetection.js` - DOM detection functions
3. `classroomVideo.js` - Skool-specific functions
4. `modal.js` - UI functions
5. `content-main.js` - Main logic that uses all above

## Testing

1. Go to `chrome://extensions/`
2. Click "Reload" on the extension
3. Test on various Skool.com pages

## Adding New Features

1. Identify which module the feature belongs to
2. Add the function to the appropriate module
3. Update this documentation if needed
4. Test thoroughly

## Benefits of This Structure

- **No single file over 150 lines** - Much easier to read and maintain
- **Clear separation of concerns** - Each file has a specific purpose
- **No build step required** - Chrome loads files in order
- **Easy to debug** - Smaller files make it easier to find issues
- **Better for collaboration** - Multiple developers can work on different modules