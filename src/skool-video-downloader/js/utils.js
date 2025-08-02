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