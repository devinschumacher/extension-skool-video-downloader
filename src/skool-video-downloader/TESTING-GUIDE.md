# Comprehensive Provider Testing Guide

## Test URLs and Expected Behavior

### 🎓 Classroom Pages (should use `detectInClassroom()`)
1. **Blueprint Training**: `https://www.skool.com/the-blueprint-training/classroom/50c1bb36?md=40cc37d92f44450daceb4a47dbb1bf87`
2. **InsightAI Academy**: `https://www.skool.com/insightai-academy-3338/classroom/0391d00a?md=2e40024f8b5a4dc5a2a3bb5ffcb3e4c9`
3. **Paid Ad Secrets**: `https://www.skool.com/paid-ad-secrets/classroom/77c8adf4?md=69a3c91b5d5b45cf873abbfe1bdb02e5`
4. **Wholesaling**: `https://www.skool.com/wholesaling/classroom/3acfb08a?md=a660699dac7941da8fb33405a6484e7f`

### 📝 Community Post Pages (should use `detectInCommunityPost()`)
1. **Blueprint Training Post**: `https://www.skool.com/the-blueprint-training/50-off-traffic-projection-tool`
2. **Insider Marketing Post**: `https://www.skool.com/insidermarketing/how-i-made-7180000-at-25-no-product-or-service`
3. **Garrett's Group Post**: `https://www.skool.com/garretts-group-7439/add-3x-rev-to-your-business-use-this-mini-ai-lead-accelerator`
4. **InsightAI Academy Post**: `https://www.skool.com/insightai-academy-3338/22cents-vs-12-cents-per-minute-voice-agent-can-you-tell-the-difference`

### ℹ️ About Page (should use about page detection)
1. **TheAspinallWay About**: `https://www.skool.com/theaspinallway/about`

## Testing Instructions

### Step 1: Install Updated Extension
1. Go to `chrome://extensions/`
2. Find "Skool Video Downloader" and click refresh/reload
3. Ensure the extension is enabled

### Step 2: Test Each URL
For each URL above:

1. **Visit the page**
2. **Open browser console** (F12 → Console tab)
3. **Click the extension icon** to trigger detection
4. **Look for these console logs:**
   ```
   🎬 [ProviderName]Provider: Detecting in classroom/about page
   🎬 [ProviderName]Provider: Detecting in element: [object HTMLElement]
   🎬 [ProviderName]Provider: Found X videos
   ```

### Step 3: Run Comprehensive Test Script
Copy and paste the content from `test-all-providers.js` into the console on each page to get detailed analysis.

### Step 4: Verify Extension Popup
1. Click the extension icon
2. Check if videos are detected and listed
3. Verify the download commands are generated correctly

## Expected Provider Detection by Location

### Classroom Pages
- **Primary Detection**: `detectInClassroom()` methods
- **Fallback**: `detectInCommunityPost()` if classroom detection fails
- **Data Sources**: `__NEXT_DATA__` script, embedded script tags
- **Common Providers**: YouTube, Loom, Vimeo, Wistia

### Community Posts  
- **Primary Detection**: `detectInCommunityPost()` methods
- **Data Sources**: DOM elements (iframes, links, images, data attributes)
- **Common Providers**: YouTube, Loom, Vimeo, Wistia, Skool native videos

### About Pages
- **Primary Detection**: `detectInCommunityPost()` on main content container
- **Data Sources**: DOM elements in about content area
- **Common Providers**: All providers supported

## Debugging Console Output

Look for these log patterns:

### ✅ Successful Detection
```
🔍 Detected page location: classroom
🎬 YouTubeProvider: Detecting in classroom/about page
🎬 YouTubeProvider: Found YouTube video ID: ABC123
🎬 YouTubeProvider: Total videos found: 1
```

### ❌ No Detection
```
🔍 Detected page location: classroom  
🎬 YouTubeProvider: Detecting in classroom/about page
🎬 YouTubeProvider: No YouTube videos found in classroom data
🎬 YouTubeProvider: Total videos found: 0
```

### 🔧 Debug Information
```
🎬 YouTubeProvider: Found 3 total iframes
🎬 YouTubeProvider: Checking iframe src: https://www.youtube.com/embed/ABC123
🎬 YouTubeProvider: Extracted video ID: ABC123
```

## Provider-Specific Expectations

### 🎥 YouTube
- **Classroom**: Embedded in `__NEXT_DATA__` or script tags
- **Community**: iframes, links, thumbnail images (`ytimg.com`)
- **Patterns**: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`

### 🎬 Loom  
- **Classroom**: URLs in `__NEXT_DATA__`
- **Community**: iframes, links to `loom.com/share/`
- **Patterns**: `loom.com/share/`, `loom.com/embed/`

### 🎭 Vimeo
- **Classroom**: URLs in `__NEXT_DATA__` or scripts
- **Community**: iframes, links to `vimeo.com`, `player.vimeo.com`
- **Patterns**: `vimeo.com/123456`, `player.vimeo.com/video/123456`

### 📺 Wistia
- **Classroom**: URLs in `__NEXT_DATA__`
- **Community**: iframes, container divs with `wistia_embed` classes
- **Patterns**: `wistia.com/medias/`, `fast.wistia.net/embed/`

### 🏫 Skool Native
- **Classroom**: MP4 URLs in `__NEXT_DATA__`
- **Community**: `<video>` elements, MP4 links
- **Patterns**: `*.skool.com/*.mp4`, direct video elements

## Troubleshooting

### No Videos Detected
1. Check if page location is detected correctly
2. Run the comprehensive test script
3. Look for provider-specific error messages
4. Verify the page actually contains video content

### Videos Detected But No Download
1. Check if license is activated
2. Verify download command generation
3. Look for popup errors

### Provider Not Working
1. Check provider-specific console logs
2. Verify the video embed format matches expected patterns
3. Test with the debug script to see raw data

## Success Criteria

For each test URL, the extension should:
- ✅ Detect the correct page location
- ✅ Find any embedded videos using appropriate provider
- ✅ Generate correct download commands
- ✅ Display videos in extension popup
- ✅ Show comprehensive debug logs in console