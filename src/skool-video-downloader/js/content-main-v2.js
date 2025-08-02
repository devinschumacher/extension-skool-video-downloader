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