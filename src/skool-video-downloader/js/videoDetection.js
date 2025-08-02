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