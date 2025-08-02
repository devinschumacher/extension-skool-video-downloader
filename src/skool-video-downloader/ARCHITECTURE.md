# Extension Architecture

## Overview

The Skool Video Downloader extension uses a provider-based architecture to support multiple video platforms across different page locations (classroom vs community posts).

## Supported Combinations

| Provider | Classroom | Community Post |
|----------|-----------|----------------|
| YouTube  | ✓         | ✓              |
| Loom     | ✓         | ✓              |
| Vimeo    | ✓         | ✓              |
| Wistia   | ✓         | ✓              |
| Skool    | ✓         | ✓              |

## File Structure

```
js/
├── providers/                    # Video provider implementations
│   ├── baseProvider.js          # Base class (54 lines)
│   ├── youtubeProvider.js       # YouTube support (111 lines)
│   ├── loomProvider.js          # Loom support (94 lines)
│   ├── vimeoProvider.js         # Vimeo support (89 lines)
│   ├── wistiaProvider.js        # Wistia support (95 lines)
│   └── skoolProvider.js         # Native Skool videos (102 lines)
├── providerRegistry.js          # Provider management (94 lines)
├── locationDetectors.js         # Page location detection (123 lines)
├── videoDetection.js            # DOM-based detection (103 lines)
├── classroomVideo.js            # Classroom-specific logic (107 lines)
├── utils.js                     # Utility functions (148 lines)
├── modal-v2.js                  # UI components (156 lines)
└── content-main-v2.js           # Main orchestration (127 lines)
```

## Provider System

### BaseVideoProvider

All providers extend the base class which defines the interface:

- `canHandle(url)` - Check if provider can handle a URL
- `extractVideoId(url)` - Extract video ID from URL
- `getNormalizedUrl(videoId)` - Get clean video URL
- `getDownloadCommand(url, isWindows)` - Generate download command
- `detectInClassroom(document)` - Detect video in classroom context
- `detectInCommunityPost(element)` - Detect video in community post
- `getSelectors()` - Get platform-specific CSS selectors

### Provider Registry

The registry manages all providers and provides:

- Provider registration
- URL-based provider lookup
- Batch detection across all providers
- Selector aggregation

## Detection Flow

1. **Page Location Detection**
   - Determines if we're on a classroom or community page
   - Uses URL patterns and DOM structure

2. **Provider-Based Detection**
   - Classroom: Each provider checks for videos in page data
   - Community: Each provider scans post elements for videos

3. **Video Enhancement**
   - Add metadata (title, duration)
   - Generate platform-specific download commands
   - Add location context

## Adding New Providers

1. Create a new provider file in `js/providers/`
2. Extend `BaseVideoProvider`
3. Implement all required methods
4. Register in `providerRegistry.js`
5. Add to manifest.json

Example:
```javascript
class NewProvider extends BaseVideoProvider {
    constructor() {
        super('newplatform');
    }
    
    canHandle(url) {
        return url.includes('newplatform.com');
    }
    
    // ... implement other methods
}
```

## Benefits

- **Scalable**: Easy to add new video platforms
- **Maintainable**: Each provider is self-contained
- **Testable**: Provider logic is isolated
- **Flexible**: Supports different detection strategies per location
- **Organized**: Clear separation of concerns