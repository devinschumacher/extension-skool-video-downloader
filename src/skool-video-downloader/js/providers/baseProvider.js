// Base provider class that all video providers extend

class BaseVideoProvider {
    constructor(name) {
        this.name = name;
    }
    
    // Check if URL belongs to this provider
    canHandle(url) {
        throw new Error('canHandle must be implemented by provider');
    }
    
    // Extract video ID from URL
    extractVideoId(url) {
        throw new Error('extractVideoId must be implemented by provider');
    }
    
    // Get normalized video URL
    getNormalizedUrl(videoId) {
        throw new Error('getNormalizedUrl must be implemented by provider');
    }
    
    // Get download command with quality settings
    getDownloadCommand(videoUrl, isWindows = false) {
        // Default implementation
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${basePath} ${quote}${videoUrl}${quote}`;
    }
    
    // Detect video in classroom context
    detectInClassroom(document) {
        return null;
    }
    
    // Detect video in community post context
    detectInCommunityPost(element) {
        return null;
    }
    
    // Get platform-specific selectors for finding videos
    getSelectors() {
        return {
            iframe: [],
            link: [],
            embed: [],
            thumbnail: []
        };
    }
    
    // Get platform display name
    getDisplayName() {
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }
    
    // Get video thumbnail URL
    getThumbnailUrl(videoId) {
        return null; // Override in provider implementations
    }
    
    // Extract thumbnail from page elements
    extractThumbnailFromElement(element) {
        // Look for common thumbnail patterns
        const img = element.querySelector('img');
        if (img && img.src) {
            return img.src;
        }
        
        // Check background images
        const bgElement = element.querySelector('[style*="background-image"]');
        if (bgElement) {
            const match = bgElement.style.backgroundImage.match(/url\(['"]?([^'")]+)['"]?\)/);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
}