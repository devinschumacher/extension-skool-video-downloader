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
            
            // Update badge to show video count
            chrome.runtime.sendMessage({
                action: 'updateBadge',
                count: videos.length
            });
        } else {
            console.log('❌ No videos found');
            
            // Clear badge when no videos found
            chrome.runtime.sendMessage({
                action: 'updateBadge',
                count: 0
            });
        }
    } catch (error) {
        console.error('Error detecting videos:', error);
    }
}

// Export for use in other scripts
window.detectAndNotifyVideos = detectAndNotifyVideos;