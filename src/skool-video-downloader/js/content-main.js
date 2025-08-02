// Content script - runs on Skool classroom pages
// Version 1.3.2 - Modularized version

// Debug mode for troubleshooting
const DEBUG_MODE = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractVideo') {
        // Always extract fresh data when popup requests it
        extractVideoForPopup(sendResponse);
        return true; // Indicates async response
    }
});

// Extract video for popup response - Fixed to only get videos from current page
function extractVideoForPopup(sendResponse) {
    const videos = [];
    
    if (DEBUG_MODE) {
        console.log('=== Video Detection Debug ===');
        console.log('Current URL:', window.location.href);
        console.log('Page title:', document.title);
    }
    
    // First, check if we're on a classroom page with lesson data
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('md');
    
    if (courseId) {
        const classroomVideo = extractClassroomVideo(courseId);
        if (classroomVideo) {
            videos.push(classroomVideo);
            console.log('Found classroom video:', classroomVideo);
        }
    }
    
    // If no classroom video found, look for videos in page elements
    if (videos.length === 0) {
        // Only look for videos that are actually visible on the current page
        const pageVideos = findVisibleVideosOnly();
        if (pageVideos.length > 0) {
            // Take only the first video to avoid confusion
            videos.push(pageVideos[0]);
            console.log('Found embedded video:', pageVideos[0]);
        }
    }
    
    // If still no videos found, search in page data as last resort
    if (videos.length === 0) {
        const dataVideos = searchPageDataForVideos();
        if (dataVideos.length > 0) {
            videos.push(dataVideos[0]);
            console.log('Found video in page data:', dataVideos[0]);
        }
    }
    
    if (DEBUG_MODE) {
        console.log('Total videos found:', videos.length);
        console.log('Videos:', videos);
    }
    
    sendResponse({ videos: videos });
}

// Extract video and show modal (for floating button - legacy support)
function extractVideo() {
    console.log('🎥 Extract video clicked');
    
    const videos = findVisibleVideosOnly();
    
    if (videos.length === 0) {
        // Check classroom video as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('md');
        
        if (courseId) {
            const classroomVideo = extractClassroomVideo(courseId);
            if (classroomVideo) {
                videos.push(classroomVideo);
            }
        }
    }
    
    if (videos.length === 0) {
        showModal({
            success: false,
            message: 'No videos found on this page. Make sure you are on a page with a video.'
        });
    } else if (videos.length === 1) {
        showModal({
            success: true,
            videoUrl: videos[0].url,
            title: videos[0].title,
            duration: videos[0].duration || null,
            type: videos[0].type
        });
    } else {
        showMultipleVideosModal(videos);
    }
}

// Make extractVideo available globally if needed
window.extractVideo = extractVideo;