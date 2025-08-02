# Changelog

All notable changes to this project will be documented in this file. For detailed release notes, see [GitHub Releases](https://github.com/devinschumacher/extension-skool-video-downloader/releases).

## Version History

### [v1.3.2] - 2025-08-02

#### Fixed
- **Video Detection**: Fixed issue where extension would download wrong YouTube video from different browser tab
  - Now only detects videos that are visible on the current page
  - Added visibility checks to prevent detecting hidden or off-screen videos
- **Video Quality**: Fixed YouTube videos downloading in lower resolution
  - Now downloads best quality up to 1080p with proper audio/video merging
  - Added format selection flags for optimal quality
- **Vimeo Support**: Added proper headers to fix Vimeo OAuth token errors (HTTP 400)
  - Added Referer header to Vimeo download commands
  - Added warning message for private Vimeo videos that may still require authentication

#### Improved
- Enhanced video detection logic to be more accurate and reliable
- Added platform-specific download commands with appropriate flags
- Better error messages and user guidance for different video platforms

### [v1.3.1](https://github.com/devinschumacher/extension-skool-video-downloader/releases/tag/v1.3.1)
### [v1.2.1](https://github.com/devinschumacher/extension-skool-video-downloader/releases/tag/v1.2.1)