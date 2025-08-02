// Content script - runs on Skool classroom pages
// Version 1.3.3 - Built from modular files
// This file is auto-generated. Edit the source files in js/ directory instead.


// === UTILITY FUNCTIONS ===
// Utility functions

// Check if element is visible on the page
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.top < window.innerHeight &&
        rect.bottom > 0
    );
}

// Extract video ID from various URL formats
function extractVideoId(url, platform) {
    switch (platform) {
        case 'youtube':
            return extractYouTubeId(url);
        case 'loom':
            return extractLoomId(url);
        case 'vimeo':
            return extractVimeoId(url);
        case 'wistia':
            return extractWistiaId(url);
        default:
            return null;
    }
}

// YouTube ID extraction
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Loom ID extraction
function extractLoomId(url) {
    const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Vimeo ID extraction
function extractVimeoId(url) {
    const match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    return match ? match[1] : null;
}

// Wistia ID extraction
function extractWistiaId(url) {
    const match = url.match(/(?:wistia\.com|wistia\.net)\/(?:medias|embed)\/(?:iframe\/)?([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Detect platform from URL
function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('loom.com')) return 'loom';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('wistia.com') || url.includes('wistia.net')) return 'wistia';
    return 'unknown';
}

// Clean and normalize video URLs
function normalizeVideoUrl(url, platform, videoId) {
    switch (platform) {
        case 'youtube':
            return `https://www.youtube.com/watch?v=${videoId}`;
        case 'loom':
            return `https://www.loom.com/share/${videoId}`;
        case 'vimeo':
            return `https://vimeo.com/${videoId}`;
        case 'wistia':
            return `https://fast.wistia.net/embed/iframe/${videoId}`;
        default:
            return url;
    }
}

// Get download command with quality settings
function getDownloadCommand(videoUrl, videoType, isWindows = false) {
    let baseCommand = 'yt-dlp ';
    
    // Add quality and format flags based on video type
    switch (videoType) {
        case 'youtube':
            // Best quality up to 1080p with merged audio
            baseCommand += '-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4 ';
            break;
        case 'vimeo':
            // Add referer header for Vimeo to avoid OAuth errors
            baseCommand += '--add-header "Referer: https://vimeo.com" ';
            break;
        default:
            // Standard download for other platforms
            break;
    }
    
    // Add output path
    if (isWindows) {
        baseCommand += `-P %USERPROFILE%\\\\Desktop "${videoUrl}"`;
    } else {
        baseCommand += `-P ~/Desktop '${videoUrl}'`;
    }
    
    return baseCommand;
}

// Find nearest title element
function findNearestTitle(element) {
    // First check parent containers
    let parent = element.parentElement;
    let depth = 0;
    
    while (parent && depth < 5) {
        // Check for headings in parent
        const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading && heading.textContent.trim()) {
            return heading;
        }
        
        // Check siblings
        const prevSibling = parent.previousElementSibling;
        if (prevSibling) {
            const siblingHeading = prevSibling.querySelector('h1, h2, h3, h4, h5, h6');
            if (siblingHeading && siblingHeading.textContent.trim()) {
                return siblingHeading;
            }
        }
        
        parent = parent.parentElement;
        depth++;
    }
    
    return null;
}

// === BASE PROVIDER CLASS THAT ALL VIDEO PROVIDERS EXTEND ===
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
        // Check if element is a video with poster
        if (element.tagName === 'VIDEO' && element.poster && !element.poster.includes('data:image')) {
            return element.poster;
        }
        
        // Look for common thumbnail patterns
        const img = element.querySelector('img');
        if (img && img.src && !img.src.includes('data:image')) {
            return img.src;
        }
        
        // Check background images
        const bgElement = element.querySelector('[style*="background-image"]');
        if (bgElement) {
            const match = bgElement.style.backgroundImage.match(/url\(['"]?([^'")]+)['"]?\)/);
            if (match && !match[1].includes('data:image')) {
                return match[1];
            }
        }
        
        // Check parent element for images
        if (element.parentElement) {
            const parentImg = element.parentElement.querySelector('img');
            if (parentImg && parentImg.src && !parentImg.src.includes('data:image')) {
                return parentImg.src;
            }
        }
        
        return null;
    }
}

// === YOUTUBE VIDEO PROVIDER ===
// YouTube video provider

class YouTubeProvider extends BaseVideoProvider {
    constructor() {
        super('youtube');
    }
    
    canHandle(url) {
        return url.includes('youtube.com') || url.includes('youtu.be');
    }
    
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    getDownloadCommand(videoUrl, isWindows = false) {
        // Best quality up to 1080p with merged audio
        const format = '-f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" --merge-output-format mp4';
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${format} ${basePath} ${quote}${videoUrl}${quote}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 YouTubeProvider: Detecting in classroom/about page');
        
        // YouTube videos in Skool classroom are typically in the metadata
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 YouTubeProvider: Checking __NEXT_DATA__ for YouTube references');
                
                // Multiple YouTube URL patterns
                const patterns = [
                    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
                    /youtu\.be\/([a-zA-Z0-9_-]+)/g,
                    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/g,
                    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            console.log('🎬 YouTubeProvider: Found YouTube video ID:', match[1]);
                            return [{
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'youtube',
                                type: 'youtube'
                            }];
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 YouTubeProvider: Error detecting YouTube in page data:', e);
            }
        }
        
        // Also check script tags for embedded YouTube players
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('youtube')) {
                const ytMatch = script.textContent.match(/youtube\.com\/(?:watch\?v=|embed\/)([a-zA-Z0-9_-]+)|youtu\.be\/([a-zA-Z0-9_-]+)/);
                if (ytMatch) {
                    const videoId = ytMatch[1] || ytMatch[2];
                    if (videoId) {
                        console.log('🎬 YouTubeProvider: Found YouTube video ID in script:', videoId);
                        return [{
                            videoId: videoId,
                            url: this.getNormalizedUrl(videoId),
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'youtube',
                            type: 'youtube'
                        }];
                    }
                }
            }
        }
        
        console.log('🎬 YouTubeProvider: No YouTube videos found in classroom data');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 YouTubeProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first (broader search)
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 YouTubeProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 YouTubeProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('youtube') || iframe.src.includes('youtu.be'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 YouTubeProvider: Extracted video ID:', videoId);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'youtube',
                        type: 'youtube'
                    });
                }
            }
        }
        
        // Check for YouTube links
        const links = element.querySelectorAll('a[href*="youtube"], a[href*="youtu.be"]');
        console.log('🎬 YouTubeProvider: Found', links.length, 'YouTube links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    thumbnail: this.getThumbnailUrl(videoId),
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        // Check for YouTube thumbnails
        const thumbnails = element.querySelectorAll('img[src*="ytimg.com"]');
        console.log('🎬 YouTubeProvider: Found', thumbnails.length, 'YouTube thumbnails');
        for (const img of thumbnails) {
            const match = img.src.match(/\/vi\/([a-zA-Z0-9_-]+)\//);
            if (match) {
                videos.push({
                    videoId: match[1],
                    url: this.getNormalizedUrl(match[1]),
                    element: img,
                    thumbnail: this.getThumbnailUrl(match[1]),
                    provider: 'youtube',
                    type: 'youtube'
                });
            }
        }
        
        // Check for embed containers
        const embedContainers = element.querySelectorAll('[data-embed-url*="youtube"], [data-embed-url*="youtu.be"], [data-src*="youtube"]');
        console.log('🎬 YouTubeProvider: Found', embedContainers.length, 'embed containers');
        for (const container of embedContainers) {
            const embedUrl = container.dataset.embedUrl || container.dataset.src;
            if (embedUrl) {
                const videoId = this.extractVideoId(embedUrl);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: container,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'youtube',
                        type: 'youtube'
                    });
                }
            }
        }
        
        console.log('🎬 YouTubeProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="youtube.com"]', 'iframe[src*="youtu.be"]'],
            link: ['a[href*="youtube.com"]', 'a[href*="youtu.be"]'],
            embed: ['[data-embed-url*="youtube"]', '[data-embed-url*="youtu.be"]'],
            thumbnail: ['img[src*="ytimg.com"]']
        };
    }
    
    getThumbnailUrl(videoId) {
        // YouTube provides predictable thumbnail URLs
        // Try maxresdefault first, then fall back to hqdefault
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
}

// === LOOM VIDEO PROVIDER ===
// Loom video provider

class LoomProvider extends BaseVideoProvider {
    constructor() {
        super('loom');
    }
    
    canHandle(url) {
        return url.includes('loom.com');
    }
    
    extractVideoId(url) {
        const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://www.loom.com/share/${videoId}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 LoomProvider: Detecting in classroom/about page');
        const videos = [];
        const foundVideoIds = new Set();
        
        // First check for video elements with Loom indicators (native player)
        const videoResults = this.detectInCommunityPost(document.body);
        for (const video of videoResults) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Loom videos in Skool classroom
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 LoomProvider: Checking __NEXT_DATA__ for Loom references');
                
                const patterns = [
                    /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/g,
                    /loom\.com\/(?:record|s)\/([a-zA-Z0-9]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && !foundVideoIds.has(match[1])) {
                            console.log('🎬 LoomProvider: Found Loom video ID:', match[1]);
                            foundVideoIds.add(match[1]);
                            videos.push({
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'loom',
                                type: 'loom'
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 LoomProvider: Error detecting Loom in page data:', e);
            }
        }
        
        // Also check script tags
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('loom')) {
                const loomMatch = script.textContent.match(/loom\.com\/(?:share|embed|record|s)\/([a-zA-Z0-9]+)/);
                if (loomMatch && !foundVideoIds.has(loomMatch[1])) {
                    console.log('🎬 LoomProvider: Found Loom video ID in script:', loomMatch[1]);
                    foundVideoIds.add(loomMatch[1]);
                    videos.push({
                        videoId: loomMatch[1],
                        url: this.getNormalizedUrl(loomMatch[1]),
                        thumbnail: this.getThumbnailUrl(loomMatch[1]),
                        provider: 'loom',
                        type: 'loom'
                    });
                }
            }
        }
        
        console.log('🎬 LoomProvider: Total Loom videos found in classroom:', videos.length);
        return videos;
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 LoomProvider: Detecting in element:', element);
        const videos = [];
        const foundVideoIds = new Set(); // Track found IDs to avoid duplicates
        
        // Check for ALL iframes first
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 LoomProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 LoomProvider: Checking iframe src:', iframe.src);
            if (iframe.src && iframe.src.includes('loom.com')) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 LoomProvider: Extracted video ID:', videoId);
                if (videoId && !foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        thumbnail: this.extractThumbnailFromElement(iframe.parentElement) || this.getThumbnailUrl(videoId),
                        provider: 'loom',
                        type: 'loom'
                    });
                }
            }
        }
        
        // Check for Loom links
        const links = element.querySelectorAll('a[href*="loom.com"]');
        console.log('🎬 LoomProvider: Found', links.length, 'Loom links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    thumbnail: this.extractThumbnailFromElement(link.parentElement) || this.getThumbnailUrl(videoId),
                    provider: 'loom',
                    type: 'loom'
                });
            }
        }
        
        // Check for data attributes
        const dataElements = element.querySelectorAll('[data-loom-id], [data-loom-video-id], [data-embed-url*="loom"], [data-src*="loom"]');
        console.log('🎬 LoomProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoId = el.dataset.loomId || el.dataset.loomVideoId || this.extractVideoId(el.dataset.embedUrl || el.dataset.src || '');
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: el,
                    thumbnail: this.extractThumbnailFromElement(el) || this.getThumbnailUrl(videoId),
                    provider: 'loom',
                    type: 'loom'
                });
            }
        }
        
        // Check for native video elements with Loom indicators
        const videoElements = element.querySelectorAll('video[id*="Loom"], video[data-loom-video-id], video track[src*="loom.com"]');
        console.log('🎬 LoomProvider: Found', videoElements.length, 'video elements with Loom indicators');
        
        for (const video of videoElements) {
            let videoId = null;
            
            // Check data-loom-video-id attribute
            if (video.getAttribute('data-loom-video-id')) {
                videoId = video.getAttribute('data-loom-video-id');
                console.log('🎬 LoomProvider: Found video ID from data-loom-video-id:', videoId);
            }
            
            // Check track elements for Loom captions
            if (!videoId) {
                const tracks = video.querySelectorAll('track[src*="loom.com"]');
                for (const track of tracks) {
                    // Extract ID from caption URL pattern: /captions/424ec901359b42ffbaec08b7bab8aabb-19.vtt
                    const match = track.src.match(/\/captions\/([a-zA-Z0-9]+)(?:-\d+)?\.vtt/);
                    if (match) {
                        videoId = match[1];
                        console.log('🎬 LoomProvider: Found video ID from caption URL:', videoId);
                        break;
                    }
                }
            }
            
            if (videoId && !foundVideoIds.has(videoId)) {
                foundVideoIds.add(videoId);
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: video,
                    thumbnail: this.extractThumbnailFromElement(video) || this.getThumbnailUrl(videoId),
                    provider: 'loom',
                    type: 'loom'
                });
            }
        }
        
        console.log('🎬 LoomProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="loom.com"]'],
            link: ['a[href*="loom.com"]'],
            embed: [
                '[data-loom-id]', 
                '[data-loom-video-id]',
                '[data-embed-url*="loom"]',
                'video[id*="Loom"]',
                'video[data-loom-video-id]',
                'video:has(track[src*="loom.com"])'
            ],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Loom thumbnail URL pattern
        // Format: https://cdn.loom.com/sessions/thumbnails/{videoId}-00001.jpg
        if (videoId && videoId.length > 10) { // Valid Loom IDs are typically 32 chars
            return `https://cdn.loom.com/sessions/thumbnails/${videoId}-00001.jpg`;
        }
        return null;
    }
}

// === VIMEO VIDEO PROVIDER ===
// Vimeo video provider

class VimeoProvider extends BaseVideoProvider {
    constructor() {
        super('vimeo');
    }
    
    canHandle(url) {
        return url.includes('vimeo.com');
    }
    
    extractVideoId(url) {
        // Handle various Vimeo URL formats
        const patterns = [
            /vimeo\.com\/(?:video\/)?([0-9]+)/,  // Standard format
            /player\.vimeo\.com\/video\/([0-9]+)/,  // Player embed format
            /vimeo\.com\/channels\/[^\/]+\/([0-9]+)/,  // Channel format
            /vimeo\.com\/groups\/[^\/]+\/videos\/([0-9]+)/  // Groups format
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://vimeo.com/${videoId}`;
    }
    
    getDownloadCommand(videoUrl, isWindows = false) {
        // Add referer header for Vimeo to avoid OAuth errors
        const headers = '--add-header "Referer: https://vimeo.com"';
        const basePath = isWindows ? '-P %USERPROFILE%\\\\Desktop' : '-P ~/Desktop';
        const quote = isWindows ? '"' : "'";
        return `yt-dlp ${headers} ${basePath} ${quote}${videoUrl}${quote}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 VimeoProvider: Detecting in classroom/about page');
        
        // Vimeo videos in Skool classroom or about pages
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 VimeoProvider: Checking __NEXT_DATA__ for Vimeo references');
                
                // Try multiple Vimeo patterns
                const patterns = [
                    /vimeo\.com\/([0-9]+)/g,
                    /player\.vimeo\.com\/video\/([0-9]+)/g,
                    /"videoId":\s*"([0-9]+)".*vimeo/gi,
                    /vimeo.*?"([0-9]+)"/g,
                    /"([0-9]{8,})".*vimeo/gi, // Long numeric IDs near vimeo mentions
                    /embed.*?vimeo.*?([0-9]+)/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            console.log('🎬 VimeoProvider: Found Vimeo video in page data:', match[1]);
                            return [{
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                thumbnail: this.getThumbnailUrl(match[1]),
                                provider: 'vimeo',
                                type: 'vimeo'
                            }];
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 VimeoProvider: Error detecting Vimeo in page data:', e);
            }
        }
        
        // Also check script tags and meta tags for Vimeo references
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && script.textContent.includes('vimeo')) {
                console.log('🎬 VimeoProvider: Found script with Vimeo reference');
                const vimeoMatch = script.textContent.match(/vimeo\.com\/([0-9]+)|player\.vimeo\.com\/video\/([0-9]+)/);
                if (vimeoMatch) {
                    const videoId = vimeoMatch[1] || vimeoMatch[2];
                    if (videoId) {
                        console.log('🎬 VimeoProvider: Extracted video ID from script:', videoId);
                        return [{
                            videoId: videoId,
                            url: this.getNormalizedUrl(videoId),
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'vimeo',
                            type: 'vimeo'
                        }];
                    }
                }
            }
        }
        
        console.log('🎬 VimeoProvider: No Vimeo videos found in classroom data');
        return [];
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 VimeoProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first (broader search)
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 VimeoProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 VimeoProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('vimeo.com') || iframe.src.includes('player.vimeo.com'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 VimeoProvider: Extracted video ID:', videoId);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'vimeo',
                        type: 'vimeo'
                    });
                }
            }
        }
        
        // Check for Vimeo links
        const links = element.querySelectorAll('a[href*="vimeo.com"]');
        console.log('🎬 VimeoProvider: Found', links.length, 'Vimeo links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    thumbnail: this.getThumbnailUrl(videoId),
                    provider: 'vimeo',
                    type: 'vimeo'
                });
            }
        }
        
        // Check for Vimeo divs with data attributes
        const vimeoDivs = element.querySelectorAll('div[data-vimeo-id], div[data-video-id*="vimeo"], [class*="vimeo"], [id*="vimeo"]');
        console.log('🎬 VimeoProvider: Found', vimeoDivs.length, 'potential Vimeo divs');
        for (const div of vimeoDivs) {
            const videoId = div.dataset.vimeoId || div.dataset.videoId;
            if (videoId && /^[0-9]+$/.test(videoId)) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: div,
                    thumbnail: this.getThumbnailUrl(videoId),
                    provider: 'vimeo',
                    type: 'vimeo'
                });
            }
        }
        
        // Also check for lazy-loaded or dynamically inserted content
        const embedContainers = element.querySelectorAll('[data-embed-url*="vimeo"], [data-src*="vimeo"]');
        console.log('🎬 VimeoProvider: Found', embedContainers.length, 'embed containers');
        for (const container of embedContainers) {
            const embedUrl = container.dataset.embedUrl || container.dataset.src;
            if (embedUrl) {
                const videoId = this.extractVideoId(embedUrl);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: container,
                        thumbnail: this.getThumbnailUrl(videoId),
                        provider: 'vimeo',
                        type: 'vimeo'
                    });
                }
            }
        }
        
        console.log('🎬 VimeoProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="vimeo.com"]', 'iframe[src*="player.vimeo.com"]'],
            link: ['a[href*="vimeo.com"]'],
            embed: ['[data-embed-url*="vimeo"]', '[data-vimeo-id]', '[data-video-id*="vimeo"]'],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Vimeo thumbnail URL - using vumbnail service which provides Vimeo thumbnails
        return `https://vumbnail.com/${videoId}.jpg`;
    }
}

// === WISTIA VIDEO PROVIDER ===
// Wistia video provider

class WistiaProvider extends BaseVideoProvider {
    constructor() {
        super('wistia');
    }
    
    canHandle(url) {
        return url.includes('wistia.com') || url.includes('wistia.net');
    }
    
    extractVideoId(url) {
        const match = url.match(/(?:wistia\.com|wistia\.net)\/(?:medias|embed)\/(?:iframe\/)?([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }
    
    getNormalizedUrl(videoId) {
        return `https://fast.wistia.net/embed/iframe/${videoId}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 WistiaProvider: Detecting in classroom/about page');
        const videos = [];
        const foundVideoIds = new Set();
        
        // First check for Wistia elements in the DOM
        const domVideos = this.detectInCommunityPost(document.body);
        for (const video of domVideos) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Wistia videos in Skool classroom
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 WistiaProvider: Checking __NEXT_DATA__ for Wistia references');
                
                const patterns = [
                    /wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/g,
                    /wistia\.(?:com|net)\/embed\/(?:iframe\/)?([a-zA-Z0-9]+)/g,
                    /fast\.wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9]+)/g,
                    /wvideo=([a-zA-Z0-9]+)/g,
                    /\/embed\/medias\/([a-zA-Z0-9]+)\.jsonp/g,
                    /wistia_async_([a-zA-Z0-9]+)/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1] && !foundVideoIds.has(match[1])) {
                            console.log('🎬 WistiaProvider: Found Wistia video ID:', match[1]);
                            foundVideoIds.add(match[1]);
                            videos.push({
                                videoId: match[1],
                                url: this.getNormalizedUrl(match[1]),
                                provider: 'wistia',
                                type: 'wistia'
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 WistiaProvider: Error detecting Wistia in page data:', e);
            }
        }
        
        // Also check script tags
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            // Check script src for wvideo parameter
            if (script.src && script.src.includes('wvideo=')) {
                const wvideoMatch = script.src.match(/wvideo=([a-zA-Z0-9]+)/);
                if (wvideoMatch && !foundVideoIds.has(wvideoMatch[1])) {
                    console.log('🎬 WistiaProvider: Found Wistia video ID in script src:', wvideoMatch[1]);
                    foundVideoIds.add(wvideoMatch[1]);
                    videos.push({
                        videoId: wvideoMatch[1],
                        url: this.getNormalizedUrl(wvideoMatch[1]),
                        provider: 'wistia',
                        type: 'wistia'
                    });
                }
            }
            
            // Check script content
            if (script.textContent && script.textContent.includes('wistia')) {
                const wistiaMatch = script.textContent.match(/wistia\.(?:com|net)\/(?:medias|embed)\/(?:iframe\/)?([a-zA-Z0-9]+)/);
                if (wistiaMatch && !foundVideoIds.has(wistiaMatch[1])) {
                    console.log('🎬 WistiaProvider: Found Wistia video ID in script:', wistiaMatch[1]);
                    foundVideoIds.add(wistiaMatch[1]);
                    videos.push({
                        videoId: wistiaMatch[1],
                        url: this.getNormalizedUrl(wistiaMatch[1]),
                        provider: 'wistia',
                        type: 'wistia'
                    });
                }
            }
        }
        
        console.log('🎬 WistiaProvider: Total Wistia videos found:', videos.length);
        return videos;
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 WistiaProvider: Detecting in element:', element);
        const videos = [];
        
        // Check for ALL iframes first
        const allIframes = element.querySelectorAll('iframe');
        console.log('🎬 WistiaProvider: Found', allIframes.length, 'total iframes');
        
        for (const iframe of allIframes) {
            console.log('🎬 WistiaProvider: Checking iframe src:', iframe.src);
            if (iframe.src && (iframe.src.includes('wistia.com') || iframe.src.includes('wistia.net'))) {
                const videoId = this.extractVideoId(iframe.src);
                console.log('🎬 WistiaProvider: Extracted video ID:', videoId);
                if (videoId) {
                    videos.push({
                        videoId: videoId,
                        url: this.getNormalizedUrl(videoId),
                        element: iframe,
                        provider: 'wistia',
                        type: 'wistia'
                    });
                }
            }
        }
        
        // Check for Wistia container divs and script embeds
        const wistiaContainers = element.querySelectorAll('[class*="wistia_embed"], [class*="wistia_async"], [id*="wistia"], script[src*="wvideo="], script[src*="fast.wistia.com"], script[src*="embed/medias"]');
        console.log('🎬 WistiaProvider: Found', wistiaContainers.length, 'Wistia containers');
        for (const container of wistiaContainers) {
            let videoId = null;
            
            // Extract video ID from class name
            if (container.className) {
                const classMatch = container.className.match(/wistia_async_([a-zA-Z0-9]+)/) || 
                                  container.className.match(/wistia_embed.*?([a-zA-Z0-9]{10,})/);
                if (classMatch) {
                    videoId = classMatch[1];
                }
            }
            
            // Extract from script src with wvideo parameter
            if (!videoId && container.tagName === 'SCRIPT' && container.src) {
                // Check for wvideo parameter
                const wvideoMatch = container.src.match(/wvideo=([a-zA-Z0-9]+)/);
                if (wvideoMatch) {
                    videoId = wvideoMatch[1];
                } else {
                    // Check for /embed/medias/{id}.jsonp pattern
                    const mediaMatch = container.src.match(/\/embed\/medias\/([a-zA-Z0-9]+)\.jsonp/);
                    if (mediaMatch) {
                        videoId = mediaMatch[1];
                    } else {
                        // Check for any ID-like pattern in fast.wistia.com URLs
                        const fastMatch = container.src.match(/fast\.wistia\.com\/.*?([a-zA-Z0-9]{10,})/);
                        if (fastMatch) {
                            videoId = fastMatch[1];
                        }
                    }
                }
            }
            
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: container,
                    provider: 'wistia',
                    type: 'wistia'
                });
            }
        }
        
        // Check for Wistia links
        const links = element.querySelectorAll('a[href*="wistia.com"], a[href*="wistia.net"]');
        console.log('🎬 WistiaProvider: Found', links.length, 'Wistia links');
        for (const link of links) {
            const videoId = this.extractVideoId(link.href);
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: link,
                    provider: 'wistia',
                    type: 'wistia'
                });
            }
        }
        
        // Check for data attributes
        const dataElements = element.querySelectorAll('[data-embed-url*="wistia"], [data-src*="wistia"], [data-wistia-id]');
        console.log('🎬 WistiaProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoId = el.dataset.wistiaId || this.extractVideoId(el.dataset.embedUrl || el.dataset.src || '');
            if (videoId) {
                videos.push({
                    videoId: videoId,
                    url: this.getNormalizedUrl(videoId),
                    element: el,
                    provider: 'wistia',
                    type: 'wistia'
                });
            }
        }
        
        console.log('🎬 WistiaProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: ['iframe[src*="wistia.com"]', 'iframe[src*="wistia.net"]'],
            link: ['a[href*="wistia.com"]'],
            embed: ['[class*="wistia_embed"]', '[data-embed-url*="wistia"]', 'script[src*="wvideo="]'],
            thumbnail: []
        };
    }
    
    getThumbnailUrl(videoId) {
        // Wistia thumbnail URL pattern
        // Format: https://embed.wistia.com/deliveries/{videoId}.jpg
        if (videoId) {
            return `https://embed.wistia.com/deliveries/${videoId}.jpg`;
        }
        return null;
    }
}

// === SKOOL.COM NATIVE VIDEO PROVIDER (FOR VIDEOS HOSTED DIRECTLY ON SKOOL) ===
// Skool.com native video provider (for videos hosted directly on Skool)

class SkoolProvider extends BaseVideoProvider {
    constructor() {
        super('skool');
    }
    
    canHandle(url) {
        // Skool native videos are typically hosted on CDN URLs or blob URLs
        return (url.includes('skool.com') && 
               (url.includes('/video/') || url.includes('.mp4') || url.includes('cdn'))) ||
               url.includes('video.skool.com') ||
               url.startsWith('blob:https://www.skool.com/');
    
    extractVideoId(url) {
        // Skool videos might not have traditional IDs, use URL hash
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts[pathParts.length - 1] || null;
    }
    
    getNormalizedUrl(videoId) {
        // For Skool native videos, the ID might be the full URL
        if (videoId.startsWith('http')) {
            return videoId;
        }
        // Otherwise construct a URL
        return `https://www.skool.com/video/${videoId}`;
    }
    
    detectInClassroom(document) {
        console.log('🎬 SkoolProvider: Detecting in classroom/about page');
        const videos = [];
        const foundVideoIds = new Set();
        
        // First check for video elements (including blob videos)
        const videoResults = this.detectInCommunityPost(document.body);
        for (const video of videoResults) {
            if (!foundVideoIds.has(video.videoId)) {
                foundVideoIds.add(video.videoId);
                videos.push(video);
            }
        }
        
        // Look for Skool native videos in classroom data
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (nextDataScript) {
            try {
                const content = nextDataScript.textContent;
                console.log('🎬 SkoolProvider: Checking __NEXT_DATA__ for Skool videos');
                
                // Look for CDN video URLs and video IDs
                const patterns = [
                    /(https:\/\/[^"]*\.skool\.com[^"]*\.mp4)/g,
                    /(https:\/\/[^"]*skool[^"]*\.mp4)/g,
                    /["']videoUrl["']\s*:\s*["']([^"']+\.mp4)["']/g,
                    /video\.skool\.com\/([a-zA-Z0-9_-]+)/g,
                    /["']videoId["']\s*:\s*["']([a-zA-Z0-9_-]+)["']/g
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (match[1]) {
                            let videoId, url;
                            
                            // Check if it's a video ID or full URL
                            if (match[1].startsWith('http')) {
                                if (this.canHandle(match[1])) {
                                    videoId = this.extractVideoId(match[1]);
                                    url = match[1];
                                }
                            } else {
                                // It's just a video ID
                                videoId = match[1];
                                url = `https://video.skool.com/${videoId}`;
                            }
                            
                            if (videoId && !foundVideoIds.has(videoId)) {
                                console.log('🎬 SkoolProvider: Found Skool video:', videoId);
                                foundVideoIds.add(videoId);
                                videos.push({
                                    videoId: videoId,
                                    url: url,
                                    thumbnail: this.getThumbnailUrl(videoId),
                                    provider: 'skool',
                                    type: 'skool'
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('🎬 SkoolProvider: Error detecting Skool video in page data:', e);
            }
        }
        
        // Also check script tags
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
            if (script.textContent && (script.textContent.includes('.mp4') || script.textContent.includes('video.skool.com'))) {
                // Look for MP4 URLs
                const mp4Match = script.textContent.match(/(https:\/\/[^"'\s]*\.mp4)/);
                if (mp4Match && this.canHandle(mp4Match[1])) {
                    const videoId = this.extractVideoId(mp4Match[1]);
                    if (!foundVideoIds.has(videoId)) {
                        console.log('🎬 SkoolProvider: Found Skool video in script:', mp4Match[1]);
                        foundVideoIds.add(videoId);
                        videos.push({
                            videoId: videoId,
                            url: mp4Match[1],
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'skool',
                            type: 'skool'
                        });
                    }
                }
                
                // Look for video.skool.com references
                const videoMatch = script.textContent.match(/video\.skool\.com\/([a-zA-Z0-9_-]+)/);
                if (videoMatch) {
                    const videoId = videoMatch[1];
                    if (!foundVideoIds.has(videoId)) {
                        console.log('🎬 SkoolProvider: Found Skool video ID in script:', videoId);
                        foundVideoIds.add(videoId);
                        videos.push({
                            videoId: videoId,
                            url: `https://video.skool.com/${videoId}`,
                            thumbnail: this.getThumbnailUrl(videoId),
                            provider: 'skool',
                            type: 'skool'
                        });
                    }
                }
            }
        }
        
        console.log('🎬 SkoolProvider: Total Skool videos found:', videos.length);
        return videos;
    }
    
    detectInCommunityPost(element) {
        console.log('🎬 SkoolProvider: Detecting in element:', element);
        const videos = [];
        const foundVideoIds = new Set(); // Track found IDs to avoid duplicates
        
        // Check for video elements
        const videoElements = element.querySelectorAll('video');
        console.log('🎬 SkoolProvider: Found', videoElements.length, 'video elements');
        for (const video of videoElements) {
            const src = video.src || video.querySelector('source')?.src;
            console.log('🎬 SkoolProvider: Checking video src:', src);
            
            // For blob videos, try to extract ID from track elements
            if (src && src.startsWith('blob:')) {
                // Look for storyboard track which contains the video ID
                const storyboardTrack = video.querySelector('track[src*="storyboard.vtt"]');
                if (storyboardTrack) {
                    const match = storyboardTrack.src.match(/\/([a-zA-Z0-9_-]+)\/storyboard\.vtt/);
                    if (match) {
                        const videoId = match[1];
                        console.log('🎬 SkoolProvider: Found video ID from storyboard:', videoId);
                        if (!foundVideoIds.has(videoId)) {
                            foundVideoIds.add(videoId);
                            videos.push({
                                videoId: videoId,
                                url: `https://video.skool.com/${videoId}`,
                                element: video,
                                thumbnail: this.extractThumbnailFromVideo(video, videoId),
                                provider: 'skool',
                                type: 'skool'
                            });
                        }
                    }
                }
                
                // Also check for any track with video.skool.com URL
                const tracks = video.querySelectorAll('track');
                for (const track of tracks) {
                    if (track.src && track.src.includes('video.skool.com')) {
                        const match = track.src.match(/video\.skool\.com\/([a-zA-Z0-9_-]+)\//);
                        if (match) {
                            const videoId = match[1];
                            if (!foundVideoIds.has(videoId)) {
                                foundVideoIds.add(videoId);
                                videos.push({
                                    videoId: videoId,
                                    url: `https://video.skool.com/${videoId}`,
                                    element: video,
                                    thumbnail: this.extractThumbnailFromVideo(video, videoId),
                                    provider: 'skool',
                                    type: 'skool'
                                });
                            }
                        }
                    }
                }
            } else if (src && this.canHandle(src)) {
                const videoId = this.extractVideoId(src);
                if (!foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: src,
                        element: video,
                        thumbnail: this.extractThumbnailFromVideo(video, videoId),
                        provider: 'skool',
                        type: 'skool'
                    });
                }
            }
        }
        
        // Check for video links
        const links = element.querySelectorAll('a[href*=".mp4"], a[href*="skool.com"]');
        console.log('🎬 SkoolProvider: Found', links.length, 'potential video links');
        for (const link of links) {
            console.log('🎬 SkoolProvider: Checking link href:', link.href);
            if (this.canHandle(link.href)) {
                const videoId = this.extractVideoId(link.href);
                if (!foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: link.href,
                        element: link,
                        provider: 'skool',
                        type: 'skool'
                    });
                }
            }
        }
        
        // Check for data attributes with video URLs
        const dataElements = element.querySelectorAll('[data-video-url], [data-src*=".mp4"]');
        console.log('🎬 SkoolProvider: Found', dataElements.length, 'data elements');
        for (const el of dataElements) {
            const videoUrl = el.dataset.videoUrl || el.dataset.src;
            if (videoUrl && this.canHandle(videoUrl)) {
                const videoId = this.extractVideoId(videoUrl);
                if (!foundVideoIds.has(videoId)) {
                    foundVideoIds.add(videoId);
                    videos.push({
                        videoId: videoId,
                        url: videoUrl,
                        element: el,
                        provider: 'skool',
                        type: 'skool'
                    });
                }
            }
        }
        
        console.log('🎬 SkoolProvider: Total videos found:', videos.length);
        return videos.length > 0 ? videos : [];
    }
    
    getSelectors() {
        return {
            iframe: [],
            link: ['a[href*=".mp4"]'],
            embed: ['video', '[data-video-url]'],
            thumbnail: []
        };
    }
    
    // Extract thumbnail from video element or generate from video ID
    extractThumbnailFromVideo(video, videoId) {
        // First try the base extractThumbnailFromElement method
        const baseThumbnail = this.extractThumbnailFromElement(video);
        if (baseThumbnail) {
            return baseThumbnail;
        }
        
        // For Skool videos, generate thumbnail URL from video ID
        if (videoId && !videoId.startsWith('http')) {
            return this.getThumbnailUrl(videoId);
        }
        
        return null;
    }
    
    getThumbnailUrl(videoId) {
        // Skool video thumbnail pattern
        // Format: https://image.video.skool.com/{videoId}/thumbnail.jpg
        if (videoId && !videoId.startsWith('http')) {
            return `https://image.video.skool.com/${videoId}/thumbnail.jpg`;
        }
        return null;
    }
}

// === PROVIDER REGISTRY - MANAGES ALL VIDEO PROVIDERS ===
// Provider registry - manages all video providers

class ProviderRegistry {
    constructor() {
        this.providers = [];
        this.providerMap = {};
    }
    
    // Register a provider
    register(provider) {
        this.providers.push(provider);
        this.providerMap[provider.name] = provider;
    }
    
    // Get provider that can handle a URL
    getProviderForUrl(url) {
        for (const provider of this.providers) {
            if (provider.canHandle(url)) {
                return provider;
            }
        }
        return null;
    }
    
    // Get provider by name
    getProviderByName(name) {
        return this.providerMap[name] || null;
    }
    
    // Detect video in classroom context
    detectInClassroom(document) {
        const detectedVideos = [];
        
        for (const provider of this.providers) {
            const result = provider.detectInClassroom(document);
            if (result) {
                // Handle both array and single object returns
                const videos = Array.isArray(result) ? result : [result];
                for (const video of videos) {
                    detectedVideos.push({
                        ...video,
                        provider: video.provider || provider.name,
                        type: video.type || provider.name
                    });
                }
            }
        }
        
        return detectedVideos;
    }
    
    // Detect video in community post
    detectInCommunityPost(element) {
        const detectedVideos = [];
        
        for (const provider of this.providers) {
            const result = provider.detectInCommunityPost(element);
            if (result) {
                // Handle both array and single object returns
                const videos = Array.isArray(result) ? result : [result];
                for (const video of videos) {
                    detectedVideos.push({
                        ...video,
                        provider: video.provider || provider.name,
                        type: video.type || provider.name
                    });
                }
            }
        }
        
        return detectedVideos;
    }
    
    // Get all selectors from all providers
    getAllSelectors() {
        const allSelectors = {
            iframe: [],
            link: [],
            embed: [],
            thumbnail: []
        };
        
        for (const provider of this.providers) {
            const selectors = provider.getSelectors();
            allSelectors.iframe.push(...selectors.iframe);
            allSelectors.link.push(...selectors.link);
            allSelectors.embed.push(...selectors.embed);
            allSelectors.thumbnail.push(...selectors.thumbnail);
        }
        
        return allSelectors;
    }
}

// Create and initialize the registry
const videoProviderRegistry = new ProviderRegistry();

// Register all providers
videoProviderRegistry.register(new YouTubeProvider());
videoProviderRegistry.register(new LoomProvider());
videoProviderRegistry.register(new VimeoProvider());
videoProviderRegistry.register(new WistiaProvider());
videoProviderRegistry.register(new SkoolProvider());

// === VIDEO DETECTION LOGIC - DOM-BASED DETECTION ===
// Video detection logic - DOM-based detection

// Extract video from iframe element
function extractVideoFromIframe(iframe) {
    const src = iframe.src;
    if (!src) return null;
    
    const platform = detectPlatform(src);
    const videoId = extractVideoId(src, platform);
    
    if (!videoId) return null;
    
    const videoUrl = normalizeVideoUrl(src, platform, videoId);
    
    // Try to get title from iframe
    let title = iframe.title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
    
    // Look for title in parent elements if iframe has no title
    if (!iframe.title) {
        const titleElement = findNearestTitle(iframe);
        if (titleElement) {
            title = titleElement.textContent.trim();
        }
    }
    
    return {
        url: videoUrl,
        title: title,
        videoId: videoId,
        type: platform
    };
}

// Find only visible videos on the current page
function findVisibleVideosOnly() {
    const videos = [];
    
    // Check only visible iframes
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
        // Check if iframe is visible
        if (!isElementVisible(iframe)) continue;
        
        const video = extractVideoFromIframe(iframe);
        if (video) {
            videos.push(video);
            // Only return first visible video
            break;
        }
    }
    
    // If no iframe found, check for lazy-loaded videos
    if (videos.length === 0) {
        const videoContainers = document.querySelectorAll(
            '.post-content, .content-body, [class*="post"], [class*="content"], article'
        );
        
        for (const container of videoContainers) {
            if (!isElementVisible(container)) continue;
            
            // Look for video links or thumbnails within visible containers
            const videoElements = container.querySelectorAll(
                'a[href*="youtube"], a[href*="youtu.be"], a[href*="loom"], ' +
                'a[href*="vimeo"], img[src*="ytimg.com"], [data-embed-url]'
            );
            
            for (const element of videoElements) {
                let url = element.href || element.dataset.embedUrl || '';
                
                // For YouTube thumbnails
                if (element.tagName === 'IMG' && element.src.includes('ytimg.com')) {
                    const match = element.src.match(/(?:ytimg\.com\/vi\/)([a-zA-Z0-9_-]+)/);
                    if (match) {
                        url = `https://www.youtube.com/watch?v=${match[1]}`;
                    }
                }
                
                if (url) {
                    const platform = detectPlatform(url);
                    const videoId = extractVideoId(url, platform);
                    
                    if (videoId) {
                        const videoUrl = normalizeVideoUrl(url, platform, videoId);
                        const titleElement = findNearestTitle(element);
                        const title = titleElement ? 
                            titleElement.textContent.trim() : 
                            `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
                        
                        videos.push({
                            url: videoUrl,
                            title: title,
                            videoId: videoId,
                            type: platform
                        });
                        
                        return videos; // Return first found
                    }
                }
            }
        }
    }
    
    return videos;
}

// === SKOOL CLASSROOM-SPECIFIC VIDEO EXTRACTION ===
// Skool classroom-specific video extraction

// Extract video from Skool classroom data
function extractClassroomVideo(courseId) {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) return null;
    
    try {
        const nextData = JSON.parse(nextDataScript.textContent);
        const course = findCourseById(nextData, courseId);
        
        if (!course || !course.metadata || !course.metadata.videoLink) {
            return null;
        }
        
        const metadata = course.metadata;
        let videoUrl = metadata.videoLink;
        const title = metadata.title || 'Untitled Lesson';
        const duration = metadata.videoLenMs ? Math.round(metadata.videoLenMs / 1000) : null;
        
        const platform = detectPlatform(videoUrl);
        const videoId = extractVideoId(videoUrl, platform);
        
        if (videoId) {
            videoUrl = normalizeVideoUrl(videoUrl, platform, videoId);
        }
        
        return {
            url: videoUrl,
            title: title,
            videoId: videoId,
            type: platform,
            duration: duration
        };
        
    } catch (e) {
        console.error('Error extracting classroom video:', e);
        return null;
    }
}

// Recursive search function for course data
function findCourseById(obj, targetId) {
    if (!obj || typeof obj !== 'object') return null;
    
    if (obj.id === targetId && obj.metadata && obj.metadata.videoLink) {
        return obj;
    }
    
    if (obj.course && obj.course.id === targetId && obj.course.metadata && obj.course.metadata.videoLink) {
        return obj.course;
    }
    
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const result = findCourseById(obj[key], targetId);
            if (result) return result;
        }
    }
    
    return null;
}

// Search for videos in page data
function searchPageDataForVideos() {
    const videos = [];
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    
    if (nextDataScript) {
        try {
            const nextDataStr = nextDataScript.textContent;
            
            // Look for video URLs in the JSON data
            const patterns = [
                /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/g,
                /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/g,
                /vimeo\.com\/([0-9]+)/g,
                /wistia\.com\/medias\/([a-zA-Z0-9]+)/g
            ];
            
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(nextDataStr)) !== null) {
                    const videoId = match[1];
                    const platform = detectPlatform(match[0]);
                    
                    if (videoId && platform !== 'unknown') {
                        const videoUrl = normalizeVideoUrl(match[0], platform, videoId);
                        
                        videos.push({
                            url: videoUrl,
                            title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
                            videoId: videoId,
                            type: platform
                        });
                        
                        // Only take first video found
                        return videos;
                    }
                }
            }
        } catch (e) {
            console.error('Error searching page data:', e);
        }
    }
    
    return videos;
}

// === LOCATION-SPECIFIC DETECTION LOGIC ===
// Location-specific detection logic

// Detect current page location type
function detectPageLocation() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    // Classroom pages typically have 'classroom' in URL or specific query params
    if (url.includes('/classroom/') || url.includes('?md=')) {
        return 'classroom';
    }
    
    // Community pages
    if (url.includes('/community/') || pathname.includes('/posts/')) {
        return 'community';
    }
    
    // About pages (treat as community-like content)
    if (pathname.includes('/about')) {
        return 'about';
    }
    
    // Community posts with direct URLs (e.g., /group-name/post-title)
    // This matches patterns like /the-blueprint-training/50-off-traffic-projection-tool
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length === 2 && !pathname.includes('/classroom/')) {
        console.log('🔍 Detected as community post by URL pattern');
        return 'community';
    }
    
    // Check for other indicators
    const hasVideoPlayer = document.querySelector('.video-player, .lesson-video, [class*="classroom"]');
    if (hasVideoPlayer) {
        return 'classroom';
    }
    
    const hasPosts = document.querySelector('.post-content, .community-post, [class*="post"]');
    if (hasPosts) {
        return 'community';
    }
    
    return 'unknown';
}

// Find all community posts on the page
function findCommunityPosts() {
    const posts = [];
    
    // Common selectors for community posts
    const postSelectors = [
        '.post-content',
        '.community-post',
        '[class*="post-body"]',
        '[class*="feed-item"]',
        'article',
        '.content-body'
    ];
    
    for (const selector of postSelectors) {
        const elements = document.querySelectorAll(selector);
        posts.push(...elements);
    }
    
    // Remove duplicates
    return [...new Set(posts)];
}

// Find classroom video container
function findClassroomContainer() {
    // Common selectors for classroom video areas
    const classroomSelectors = [
        '.video-container',
        '.lesson-video',
        '.classroom-content',
        '[class*="video-player"]',
        '.lesson-content',
        'main'
    ];
    
    for (const selector of classroomSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    
    // Fallback to body
    return document.body;
}

// Detect videos based on page location
function detectVideosByLocation(registry) {
    const location = detectPageLocation();
    const videos = [];
    
    if (location === 'classroom') {
        // First try classroom-specific detection
        const classroomVideos = registry.detectInClassroom(document);
        videos.push(...classroomVideos);
        
        // If no videos found, try generic detection in classroom container
        if (videos.length === 0) {
            const container = findClassroomContainer();
            const communityVideos = detectVideosInElement(container, registry);
            videos.push(...communityVideos);
        }
    } else if (location === 'community') {
        // Find all posts and detect videos in each
        const posts = findCommunityPosts();
        
        for (const post of posts) {
            const postVideos = detectVideosInElement(post, registry);
            videos.push(...postVideos);
        }
    } else if (location === 'about') {
        // About pages - scan main content area with broader selectors
        console.log('🔍 Detecting videos on about page');
        
        // Try multiple container selectors for about pages
        const containerSelectors = [
            'main',
            '.about-content', 
            '[class*="about"]',
            '.content',
            'article',
            '.page-content',
            '.description',
            '[role="main"]',
            '.main-content'
        ];
        
        let aboutContainer = null;
        for (const selector of containerSelectors) {
            aboutContainer = document.querySelector(selector);
            if (aboutContainer) {
                console.log('🔍 Using container:', selector);
                break;
            }
        }
        
        // Fallback to body
        if (!aboutContainer) {
            console.log('🔍 Using fallback: document.body');
            aboutContainer = document.body;
        }
        
        const aboutVideos = detectVideosInElement(aboutContainer, registry);
        console.log('🔍 Found videos in about page:', aboutVideos.length);
        videos.push(...aboutVideos);
    } else {
        // Unknown location - scan entire page
        const allVideos = detectVideosInElement(document.body, registry);
        videos.push(...allVideos);
    }
    
    // Add location info to videos
    return videos.map(video => ({
        ...video,
        location: location
    }));
}

// Detect videos in a specific element using all providers
function detectVideosInElement(element, registry) {
    const videos = [];
    
    // Try community post detection for each provider
    const detectedVideos = registry.detectInCommunityPost(element);
    videos.push(...detectedVideos);
    
    return videos;
}

// === DYNAMIC VIDEO DETECTION FOR LAZY-LOADED CONTENT ===
// Dynamic video detection for lazy-loaded content

// Set up a mutation observer to detect dynamically added videos
function setupDynamicVideoDetection(callback) {
    let debounceTimer;
    
    const observer = new MutationObserver((mutations) => {
        // Debounce to avoid too many calls
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            let shouldCheck = false;
            
            for (const mutation of mutations) {
                // Check if any video-related elements were added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        const element = node;
                        // Check for various video indicators
                        if (element.tagName === 'IFRAME' || 
                            element.tagName === 'VIDEO' ||
                            element.querySelector?.('iframe') ||
                            element.querySelector?.('video') ||
                            element.className?.includes('video') ||
                            element.innerHTML?.includes('vimeo') ||
                            element.innerHTML?.includes('youtube') ||
                            element.innerHTML?.includes('loom') ||
                            element.innerHTML?.includes('wistia') ||
                            element.innerHTML?.includes('skool') ||
                            element.querySelector?.('[src*="blob:"]') ||
                            element.querySelector?.('track[src*="video.skool.com"]')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }
                
                // Also check for attribute changes on video elements
                if (mutation.type === 'attributes' && mutation.target.tagName === 'VIDEO') {
                    shouldCheck = true;
                }
                if (shouldCheck) break;
            }
            
            if (shouldCheck) {
                console.log('Dynamic content detected, checking for videos...');
                callback();
            }
        }, 500); // Wait 500ms after last mutation
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src', 'data-video-id']
    });
    
    return observer;
}

// Check if an element is likely to contain video
function isVideoElement(element) {
    if (!element || element.nodeType !== 1) return false;
    
    const tag = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    
    return (
        tag === 'iframe' ||
        tag === 'video' ||
        className.includes('video') ||
        className.includes('vimeo') ||
        className.includes('youtube') ||
        id.includes('video') ||
        element.hasAttribute('data-video-id') ||
        element.hasAttribute('data-vimeo-id')
    );
}

// === MODAL UI FUNCTIONALITY WITH PROVIDER SUPPORT ===
// Modal UI functionality with provider support

// Handle video selection from multiple videos modal
window.handleVideoSelect = function(encodedData, providerName) {
    try {
        const videoData = JSON.parse(atob(encodedData));
        
        // Get provider if available
        if (providerName && typeof videoProviderRegistry !== 'undefined') {
            videoData.provider = videoProviderRegistry.getProviderByName(providerName);
        }
        
        // Remove the multiple videos modal
        const multiModal = document.getElementById('skool-video-modal');
        if (multiModal) {
            multiModal.remove();
        }
        
        // Show the single video modal
        showModal(videoData);
    } catch (error) {
        console.error('Error handling video selection:', error);
    }
};

// Show modal with video information
function showModal(data) {
    // Remove existing modal if any
    const existingModal = document.getElementById('skool-video-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'skool-video-modal';
    
    if (data.success) {
        const durationStr = data.duration ? 
            `${Math.floor(data.duration/60)}:${(data.duration%60).toString().padStart(2, '0')}` : 
            'Unknown';
        
        // Get download commands from provider if available
        let macCommand, winCommand;
        if (data.provider && data.provider.getDownloadCommand) {
            macCommand = data.provider.getDownloadCommand(data.videoUrl, false);
            winCommand = data.provider.getDownloadCommand(data.videoUrl, true);
        } else {
            // Fallback to legacy command generation
            macCommand = getDownloadCommand(data.videoUrl, data.type || 'unknown', false);
            winCommand = getDownloadCommand(data.videoUrl, data.type || 'unknown', true);
        }
            
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
                
                <p class="video-title">"${data.title}"</p>
                <p class="video-duration">Duration: ${durationStr}</p>
                ${data.location ? `<p class="video-location">Location: ${data.location}</p>` : ''}
                
                <div class="download-section">
                    <h3>Download Instructions</h3>
                    
                    <div class="os-section">
                        <div class="video-url-container">
                            <button onclick="navigator.clipboard.writeText('${macCommand.replace(/'/g, "\\'").replace(/"/g, "&quot;")}'); this.textContent='Copied!'">Copy Mac Command</button>
                        </div>
                        <ol>
                            <li>Click the 'Copy Mac Command' button above</li>
                            <li>Open Terminal application</li>
                            <li>Paste the command & press enter</li>
                        </ol>
                    </div>
                    
                    <div class="os-section">
                        <div class="video-url-container">
                            <button onclick="navigator.clipboard.writeText('${winCommand.replace(/'/g, "\\'").replace(/"/g, "&quot;")}'); this.textContent='Copied!'">Copy Windows Command</button>
                        </div>
                        <ol>
                            <li>Click the 'Copy Windows Command' button above</li>
                            <li>Open Command Prompt (cmd) or PowerShell</li>
                            <li>Paste the command & press enter</li>
                        </ol>
                    </div>
                    
                    <p class="download-note">The video will download to your desktop</p>
                    ${getProviderSpecificNotes(data.type)}
                </div>
                
                <div class="youtube-section">
                    <h3>Need help?</h3>
                    <p>If you're stuck ask for help in the <a href="https://serp.ly/@serp/community/support" target="_blank">Community</a></p>
                </div>
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content error">
                <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
                <h2>❌ Error</h2>
                <p>${data.message}</p>
                
                <div class="cta-section">
                    <p>Need help? Check out the tutorial:</p>
                    <a href="https://youtube.com/@devinschumacher" target="_blank" class="cta-button youtube">
                        Watch Tutorial on YouTube
                    </a>
                </div>
            </div>
        `;
    }
    
    document.body.appendChild(modal);
}

// Get provider-specific notes
function getProviderSpecificNotes(type) {
    switch (type) {
        case 'youtube':
            return '<p class="download-note" style="color: #059669;">✓ Will download in best quality (up to 1080p)</p>';
        case 'vimeo':
            return '<p class="download-note" style="color: #dc2626;">⚠️ If you get an OAuth error, the video may be private. Try using browser developer tools.</p>';
        case 'wistia':
            return '<p class="download-note" style="color: #0ea5e9;">ℹ️ Wistia videos may have multiple quality options available.</p>';
        case 'loom':
            return '<p class="download-note" style="color: #8b5cf6;">✓ Loom videos download in their original quality.</p>';
        case 'skool':
            return '<p class="download-note" style="color: #f59e0b;">✓ Native Skool video detected.</p>';
        default:
            return '';
    }
}

// Show modal for multiple videos
function showMultipleVideosModal(videos) {
    const existingModal = document.getElementById('skool-video-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'skool-video-modal';
    
    let videoButtons = videos.map((video, index) => {
        const provider = videoProviderRegistry.getProviderByName(video.provider || video.type);
        const providerName = provider ? provider.getDisplayName() : video.type;
        const location = video.location ? ` (${video.location})` : '';
        
        // Generate thumbnail for button
        let thumbnailHtml = '';
        if (video.thumbnail) {
            thumbnailHtml = `<img src="${video.thumbnail}" alt="${video.title}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; vertical-align: middle;">`;
        } else if (video.type === 'youtube' && video.videoId) {
            thumbnailHtml = `<img src="https://img.youtube.com/vi/${video.videoId}/default.jpg" alt="${video.title}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; vertical-align: middle;">`;
        }
        
        const videoData = {
            success: true,
            videoUrl: video.url,
            title: video.title.replace(/'/g, "\\'"),
            duration: video.duration || null,
            type: video.type || 'unknown',
            location: video.location || ''
        };
        
        return `<button onclick="window.handleVideoSelect('${btoa(JSON.stringify(videoData))}', '${provider ? provider.name : ''}')" class="video-select-btn" style="display: flex; align-items: center; width: 100%; text-align: left; padding: 12px;">
            ${thumbnailHtml}
            <span>${video.title} - ${providerName}${location}</span>
        </button>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('#skool-video-modal').remove()">×</button>
            <h2>Multiple Videos Found</h2>
            <p>Select a video to download:</p>
            <div class="video-list">
                ${videoButtons}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Legacy function for floating button (if needed)
window.downloadVideoUrl = function(url, title) {
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    const content = url;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `video_${safeTitle}.txt`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
}

// Make showModal available globally for inline onclick handlers
window.showModal = showModal;

// === CONTENT SCRIPT - MAIN ORCHESTRATION WITH PROVIDER-BASED ARCHITECTURE ===
// Content script - main orchestration with provider-based architecture
// Version 1.3.3 - Provider-based modular structure

// Debug mode for troubleshooting
const DEBUG_MODE = true; // Temporarily enable for debugging

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractVideo') {
        // Extract videos using the new provider system
        extractVideoForPopup(sendResponse);
        return true; // Indicates async response
    }
});

// Extract video for popup response using provider registry
function extractVideoForPopup(sendResponse) {
    if (DEBUG_MODE) {
        console.log('=== Video Detection Debug ===');
        console.log('Current URL:', window.location.href);
        console.log('Page title:', document.title);
    }
    
    // Detect videos using location-aware detection
    const videos = detectVideosByLocation(videoProviderRegistry);
    
    // If no videos found with location detection, try legacy detection
    if (videos.length === 0) {
        const legacyVideos = detectVideosLegacy();
        videos.push(...legacyVideos);
    }
    
    // Enhance videos with metadata
    const enhancedVideos = videos.map(video => {
        const provider = videoProviderRegistry.getProviderByName(video.provider || video.type);
        
        if (provider) {
            // Generate thumbnail if not already present
            let thumbnail = video.thumbnail;
            if (!thumbnail && video.videoId && provider.getThumbnailUrl) {
                thumbnail = provider.getThumbnailUrl(video.videoId);
            }
            
            return {
                ...video,
                url: video.url || provider.getNormalizedUrl(video.videoId),
                title: video.title || findVideoTitle(video.element) || `${provider.getDisplayName()} Video`,
                type: video.type || provider.name,
                thumbnail: thumbnail,
                providerName: provider.name // Add provider name for popup
            };
        }
        
        return video;
    });
    
    if (DEBUG_MODE) {
        console.log('Total videos found:', enhancedVideos.length);
        console.log('Videos:', enhancedVideos);
    }
    
    sendResponse({ videos: enhancedVideos });
}

// Legacy detection for backward compatibility
function detectVideosLegacy() {
    const videos = [];
    
    // Check URL params for classroom video
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('md');
    
    if (courseId) {
        const classroomVideo = extractClassroomVideo(courseId);
        if (classroomVideo) {
            videos.push(classroomVideo);
        }
    }
    
    // If no classroom video, check visible videos
    if (videos.length === 0) {
        const visibleVideos = findVisibleVideosOnly();
        videos.push(...visibleVideos);
    }
    
    return videos;
}

// Find video title from element context
function findVideoTitle(element) {
    if (!element) return null;
    
    // Check element attributes
    if (element.title) return element.title;
    if (element.alt) return element.alt;
    
    // Find nearest title
    const titleElement = findNearestTitle(element);
    if (titleElement) {
        return titleElement.textContent.trim();
    }
    
    return null;
}

// Extract video and show modal (for floating button - legacy support)
function extractVideo() {
    console.log('🎥 Extract video clicked');
    
    // Use new provider-based detection
    const videos = detectVideosByLocation(videoProviderRegistry);
    
    if (videos.length === 0) {
        showModal({
            success: false,
            message: 'No videos found on this page. Make sure you are on a page with a video.'
        });
    } else if (videos.length === 1) {
        const video = videos[0];
        const provider = videoProviderRegistry.getProviderByName(video.provider || video.type);
        
        showModal({
            success: true,
            videoUrl: video.url,
            title: video.title,
            duration: video.duration || null,
            type: video.type,
            provider: provider
        });
    } else {
        showMultipleVideosModal(videos);
    }
}

// Make extractVideo available globally if needed
window.extractVideo = extractVideo;

// === CONTENT SCRIPT INITIALIZATION - SETS UP DYNAMIC DETECTION AND RUNS INITIAL SCAN ===
// Content script initialization - sets up dynamic detection and runs initial scan
// This file ensures videos are detected both on page load and when dynamically added

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVideoDetection);
} else {
    // DOM already loaded
    initializeVideoDetection();
}

// Initialize video detection system
function initializeVideoDetection() {
    console.log('🎬 Initializing Skool Video Downloader...');
    
    // Run initial detection after a short delay to ensure page is fully loaded
    setTimeout(() => {
        console.log('🔍 Running initial video detection...');
        detectAndNotifyVideos();
    }, 1000);
    
    // Set up mutation observer for dynamic content
    setupDynamicVideoDetection(() => {
        console.log('🔄 Dynamic content detected, re-scanning for videos...');
        detectAndNotifyVideos();
    });
    
    // Also listen for video play events (for lazy-loaded videos)
    document.addEventListener('play', handleVideoPlay, true);
    
    // Listen for clicks that might trigger video loading
    document.addEventListener('click', handlePotentialVideoClick, true);
}

// Handle video play events
function handleVideoPlay(event) {
    if (event.target.tagName === 'VIDEO') {
        console.log('🎬 Video play detected, checking for new videos...');
        setTimeout(() => {
            detectAndNotifyVideos();
        }, 500);
    }
}

// Handle clicks that might load videos
function handlePotentialVideoClick(event) {
    const target = event.target;
    const isVideoTrigger = 
        target.classList.contains('play-button') ||
        target.classList.contains('video-thumbnail') ||
        target.classList.contains('video-container') ||
        target.closest('[class*="video"]') ||
        target.closest('[class*="play"]') ||
        target.closest('a[href*="youtube"]') ||
        target.closest('a[href*="vimeo"]') ||
        target.closest('a[href*="loom"]') ||
        target.closest('a[href*="wistia"]');
    
    if (isVideoTrigger) {
        console.log('🖱️ Potential video trigger clicked, checking for videos...');
        setTimeout(() => {
            detectAndNotifyVideos();
        }, 1000);
    }
}

// Detect videos and notify popup if needed
function detectAndNotifyVideos() {
    try {
        const videos = detectVideosByLocation(videoProviderRegistry);
        
        if (videos.length > 0) {
            console.log(`✅ Found ${videos.length} video(s)`);
            videos.forEach((video, index) => {
                console.log(`  ${index + 1}. ${video.provider || video.type}: ${video.title || video.videoId}`);
            });
            
            // Store detected videos for popup
            chrome.storage.local.set({ 
                detectedVideos: videos,
                lastDetection: Date.now()
            });
        } else {
            console.log('❌ No videos found');
        }
    } catch (error) {
        console.error('Error detecting videos:', error);
    }
}

// Export for use in other scripts
window.detectAndNotifyVideos = detectAndNotifyVideos;
